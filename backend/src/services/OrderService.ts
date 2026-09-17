import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import {
    OrderStatus,
    StockMovementType
} from "../generated/prisma/enums.js";

export interface OrderProductInput {
    productId: string;
    quantity: number;
    billedUnitPricePaise: number;
}

export interface OrderServiceInput {
    serviceId: string;
    serviceName: string;
    quantity: number;
    standardUnitPricePaise: number;
    billedUnitPricePaise: number;
    gstRateBasisPoints: number;
}

export interface CreateOrderInput {
    idempotencyKey: string;
    customerName?: string;
    customerMobile?: string;
    vehiclePlateNumber?: string;
    vehicleModel?: string;
    products: OrderProductInput[];
    service?: OrderServiceInput;
}

export interface CreatedOrder {
    id: string;
    billNumber: string;
    grandTotalPaise: number;
    status: OrderStatus;
    alreadyConfirmed: boolean;
}

export type CreateOrderResult =
    | {
    success: true;
    order: CreatedOrder;
}
    | {
    success: false;
    reason:
        | "PRODUCT_NOT_FOUND"
        | "INSUFFICIENT_STOCK";
    productId: string;
};

class OrderCreationError extends Error {
    constructor(
        public readonly code:
            | "PRODUCT_NOT_FOUND"
            | "INSUFFICIENT_STOCK",
        public readonly productId: string
    ) {
        super(code);
    }
}

function calculateIncludedTax(
    totalPaise: number,
    gstRateBasisPoints: number
): number {
    return Math.round(
        (totalPaise * gstRateBasisPoints) /
        (10000 + gstRateBasisPoints)
    );
}

export class OrderService {
    async createConfirmedOrder(
        createdById: string,
        input: CreateOrderInput
    ): Promise<CreateOrderResult> {
        const existingOrder =
            await database.order.findUnique({
                where: {
                    idempotencyKey:
                    input.idempotencyKey
                }
            });

        if (existingOrder) {
            return {
                success: true,
                order: {
                    id: existingOrder.id,
                    billNumber:
                    existingOrder.billNumber,
                    grandTotalPaise:
                    existingOrder.grandTotalPaise,
                    status: existingOrder.status,
                    alreadyConfirmed: true
                }
            };
        }

        try {
            const order = await database.$transaction(
                async (transaction) => {
                    const productIds =
                        input.products.map(
                            (product) =>
                                product.productId
                        );

                    const inventoryItems =
                        await transaction
                            .inventoryItem
                            .findMany({
                                where: {
                                    productId: {
                                        in: productIds
                                    },
                                    isActive: true
                                }
                            });

                    const inventoryByProductId =
                        new Map(
                            inventoryItems.map(
                                (item) => [
                                    item.productId,
                                    item
                                ]
                            )
                        );

                    const calculatedProductLines =
                        input.products.map(
                            (product) => {
                                const inventoryItem =
                                    inventoryByProductId.get(
                                        product.productId
                                    );

                                if (!inventoryItem) {
                                    throw new OrderCreationError(
                                        "PRODUCT_NOT_FOUND",
                                        product.productId
                                    );
                                }

                                if (
                                    inventoryItem.currentStock <
                                    product.quantity
                                ) {
                                    throw new OrderCreationError(
                                        "INSUFFICIENT_STOCK",
                                        product.productId
                                    );
                                }

                                const lineTotalPaise =
                                    product.billedUnitPricePaise *
                                    product.quantity;

                                const includedTaxPaise =
                                    calculateIncludedTax(
                                        lineTotalPaise,
                                        inventoryItem
                                            .gstRateBasisPoints
                                    );

                                return {
                                    input: product,
                                    inventoryItem,
                                    lineTotalPaise,
                                    includedTaxPaise
                                };
                            }
                        );

                    const serviceLine = input.service
                        ? {
                            ...input.service,
                            lineTotalPaise:
                                input.service
                                    .billedUnitPricePaise *
                                input.service.quantity,
                            includedTaxPaise:
                                calculateIncludedTax(
                                    input.service
                                        .billedUnitPricePaise *
                                    input.service
                                        .quantity,
                                    input.service
                                        .gstRateBasisPoints
                                )
                        }
                        : null;

                    const productsTotalPaise =
                        calculatedProductLines.reduce(
                            (total, line) =>
                                total +
                                line.lineTotalPaise,
                            0
                        );

                    const serviceTotalPaise =
                        serviceLine?.lineTotalPaise ??
                        0;

                    const includedTaxPaise =
                        calculatedProductLines.reduce(
                            (total, line) =>
                                total +
                                line.includedTaxPaise,
                            0
                        ) +
                        (serviceLine
                            ?.includedTaxPaise ?? 0);

                    const grandTotalPaise =
                        productsTotalPaise +
                        serviceTotalPaise;

                    const billNumber =
                        `MRF-${Date.now()}-${randomUUID()
                            .slice(0, 8)
                            .toUpperCase()}`;

                    const createdOrder =
                        await transaction.order.create({
                            data: {
                                billNumber,
                                idempotencyKey:
                                input.idempotencyKey,
                                createdById,
                                status:
                                OrderStatus.CONFIRMED,
                                customerName:
                                    input.customerName
                                        ?.trim() || null,
                                customerMobile:
                                    input.customerMobile
                                        ?.trim() || null,
                                vehiclePlateNumber:
                                    input.vehiclePlateNumber
                                        ?.trim()
                                        .toUpperCase() ||
                                    null,
                                vehicleModel:
                                    input.vehicleModel
                                        ?.trim() || null,
                                productsTotalPaise,
                                serviceTotalPaise,
                                includedTaxPaise,
                                grandTotalPaise
                            }
                        });

                    for (const line of calculatedProductLines) {
                        const updateResult =
                            await transaction
                                .inventoryItem
                                .updateMany({
                                    where: {
                                        id: line
                                            .inventoryItem
                                            .id,
                                        isActive: true,
                                        currentStock: {
                                            gte: line.input
                                                .quantity
                                        }
                                    },
                                    data: {
                                        currentStock: {
                                            decrement:
                                            line.input
                                                .quantity
                                        },
                                        version: {
                                            increment: 1
                                        }
                                    }
                                });

                        if (updateResult.count !== 1) {
                            throw new OrderCreationError(
                                "INSUFFICIENT_STOCK",
                                line.input.productId
                            );
                        }

                        const updatedInventory =
                            await transaction
                                .inventoryItem
                                .findUniqueOrThrow({
                                    where: {
                                        id: line
                                            .inventoryItem
                                            .id
                                    },
                                    select: {
                                        currentStock: true
                                    }
                                });

                        await transaction.orderItem.create({
                            data: {
                                orderId:
                                createdOrder.id,
                                inventoryItemId:
                                line.inventoryItem.id,
                                productIdSnapshot:
                                line.inventoryItem
                                    .productId,
                                billingMatchKeySnapshot:
                                line.inventoryItem
                                    .billingMatchKey,
                                productNameSnapshot:
                                line.inventoryItem
                                    .patternAndSize,
                                quantity:
                                line.input.quantity,
                                standardUnitPricePaise:
                                line.inventoryItem
                                    .finalSellingPricePaise,
                                billedUnitPricePaise:
                                line.input
                                    .billedUnitPricePaise,
                                gstRateBasisPoints:
                                line.inventoryItem
                                    .gstRateBasisPoints,
                                includedTaxPaise:
                                line.includedTaxPaise,
                                lineTotalPaise:
                                line.lineTotalPaise,
                                baseCostPaiseSnapshot:
                                line.inventoryItem
                                    .baseCostPaise
                            }
                        });

                        await transaction
                            .stockMovement
                            .create({
                                data: {
                                    inventoryItemId:
                                    line.inventoryItem
                                        .id,
                                    performedById:
                                    createdById,
                                    orderId:
                                    createdOrder.id,
                                    type:
                                    StockMovementType.SALE,
                                    quantityChange:
                                        -line.input
                                            .quantity,
                                    stockBefore:
                                        updatedInventory
                                            .currentStock +
                                        line.input
                                            .quantity,
                                    stockAfter:
                                    updatedInventory
                                        .currentStock,
                                    unitCostPaise:
                                    line.inventoryItem
                                        .baseCostPaise,
                                    referenceNumber:
                                    billNumber,
                                    note:
                                        "Stock deducted from confirmed bill"
                                }
                            });
                    }

                    if (serviceLine) {
                        await transaction
                            .orderServiceLine
                            .create({
                                data: {
                                    orderId:
                                    createdOrder.id,
                                    serviceIdSnapshot:
                                    serviceLine.serviceId,
                                    serviceNameSnapshot:
                                    serviceLine.serviceName,
                                    quantity:
                                    serviceLine.quantity,
                                    standardUnitPricePaise:
                                    serviceLine
                                        .standardUnitPricePaise,
                                    billedUnitPricePaise:
                                    serviceLine
                                        .billedUnitPricePaise,
                                    gstRateBasisPoints:
                                    serviceLine
                                        .gstRateBasisPoints,
                                    includedTaxPaise:
                                    serviceLine
                                        .includedTaxPaise,
                                    lineTotalPaise:
                                    serviceLine
                                        .lineTotalPaise
                                }
                            });
                    }

                    return {
                        id: createdOrder.id,
                        billNumber:
                        createdOrder.billNumber,
                        grandTotalPaise:
                        createdOrder.grandTotalPaise,
                        status: createdOrder.status,
                        alreadyConfirmed: false
                    };
                }
            );

            return {
                success: true,
                order
            };
        } catch (error: unknown) {
            if (error instanceof OrderCreationError) {
                return {
                    success: false,
                    reason: error.code,
                    productId: error.productId
                };
            }

            throw error;
        }
    }
}