import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import {
    OrderStatus,
    ServiceType,
    StockMovementType
} from "../generated/prisma/enums.js";

export interface OrderProductInput {
    productId: string;
    quantity: number;
    billedUnitPricePaise: number;
}

export interface OrderServiceInput {
    serviceId: string;
    quantity: number;
    billedUnitPricePaise: number;
}

export interface CreateOrderInput {
    idempotencyKey: string;
    customerName?: string;
    customerMobile?: string;
    vehiclePlateNumber?: string;
    vehicleModel?: string;
    products: OrderProductInput[];
    services: OrderServiceInput[];
}

export interface CreatedOrder {
    id: string;
    billNumber: string;
    grandTotalPaise: number;
    status: OrderStatus;
    alreadyConfirmed: boolean;
}

type OrderFailureReason =
    | "PRODUCT_NOT_FOUND"
    | "INSUFFICIENT_STOCK"
    | "SERVICE_NOT_FOUND"
    | "VEHICLE_DETAILS_REQUIRED";

export type CreateOrderResult =
    | {
    success: true;
    order: CreatedOrder;
}
    | {
    success: false;
    reason: OrderFailureReason;
    referenceId: string;
};

class OrderCreationError extends Error {
    constructor(
        public readonly code: OrderFailureReason,
        public readonly referenceId: string
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

function determineCombinedServiceType(
    serviceTypes: ServiceType[]
): ServiceType {
    if (
        serviceTypes.includes(
            ServiceType.BOTH
        )
    ) {
        return ServiceType.BOTH;
    }

    const hasAlignment =
        serviceTypes.includes(
            ServiceType.ALIGNMENT
        );

    const hasBalancing =
        serviceTypes.includes(
            ServiceType.BALANCING
        );

    if (
        hasAlignment &&
        hasBalancing
    ) {
        return ServiceType.BOTH;
    }

    if (hasAlignment) {
        return ServiceType.ALIGNMENT;
    }

    if (hasBalancing) {
        return ServiceType.BALANCING;
    }

    return ServiceType.OTHER;
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
                    existingOrder
                        .grandTotalPaise,
                    status:
                    existingOrder.status,
                    alreadyConfirmed: true
                }
            };
        }

        try {
            const order =
                await database.$transaction(
                    async (transaction) => {
                        const productIds =
                            input.products.map(
                                (product) =>
                                    product.productId
                            );

                        const inventoryItems =
                            productIds.length > 0
                                ? await transaction
                                    .inventoryItem
                                    .findMany({
                                        where: {
                                            productId: {
                                                in: productIds
                                            },
                                            isActive:
                                                true
                                        }
                                    })
                                : [];

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
                                        inventoryItem
                                            .currentStock <
                                        product.quantity
                                    ) {
                                        throw new OrderCreationError(
                                            "INSUFFICIENT_STOCK",
                                            product.productId
                                        );
                                    }

                                    const lineTotalPaise =
                                        product
                                            .billedUnitPricePaise *
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

                        const normalizedServiceIds =
                            input.services.map(
                                (service) =>
                                    service.serviceId
                                        .trim()
                                        .toUpperCase()
                            );

                        const catalogueServices =
                            normalizedServiceIds
                                .length > 0
                                ? await transaction
                                    .serviceCatalogueItem
                                    .findMany({
                                        where: {
                                            serviceId: {
                                                in: normalizedServiceIds
                                            },
                                            isActive:
                                                true
                                        }
                                    })
                                : [];

                        const serviceByServiceId =
                            new Map(
                                catalogueServices.map(
                                    (service) => [
                                        service.serviceId,
                                        service
                                    ]
                                )
                            );

                        const calculatedServiceLines =
                            input.services.map(
                                (service) => {
                                    const normalizedServiceId =
                                        service.serviceId
                                            .trim()
                                            .toUpperCase();

                                    const catalogueService =
                                        serviceByServiceId.get(
                                            normalizedServiceId
                                        );

                                    if (!catalogueService) {
                                        throw new OrderCreationError(
                                            "SERVICE_NOT_FOUND",
                                            service.serviceId
                                        );
                                    }

                                    const lineTotalPaise =
                                        service
                                            .billedUnitPricePaise *
                                        service.quantity;

                                    const includedTaxPaise =
                                        calculateIncludedTax(
                                            lineTotalPaise,
                                            catalogueService
                                                .gstRateBasisPoints
                                        );

                                    return {
                                        input: service,
                                        catalogueService,
                                        lineTotalPaise,
                                        includedTaxPaise
                                    };
                                }
                            );

                        const workshopServiceLines =
                            calculatedServiceLines.filter(
                                (line) =>
                                    line.catalogueService
                                        .createsServiceJob
                            );

                        if (
                            workshopServiceLines.length >
                            0 &&
                            (!input.vehiclePlateNumber
                                    ?.trim() ||
                                !input.vehicleModel
                                    ?.trim())
                        ) {
                            throw new OrderCreationError(
                                "VEHICLE_DETAILS_REQUIRED",
                                ""
                            );
                        }

                        const productsTotalPaise =
                            calculatedProductLines.reduce(
                                (total, line) =>
                                    total +
                                    line.lineTotalPaise,
                                0
                            );

                        const serviceTotalPaise =
                            calculatedServiceLines.reduce(
                                (total, line) =>
                                    total +
                                    line.lineTotalPaise,
                                0
                            );

                        const includedTaxPaise =
                            calculatedProductLines.reduce(
                                (total, line) =>
                                    total +
                                    line.includedTaxPaise,
                                0
                            ) +
                            calculatedServiceLines.reduce(
                                (total, line) =>
                                    total +
                                    line.includedTaxPaise,
                                0
                            );

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
                                            ?.trim() ||
                                        null,

                                    customerMobile:
                                        input.customerMobile
                                            ?.trim() ||
                                        null,

                                    vehiclePlateNumber:
                                        input.vehiclePlateNumber
                                            ?.trim()
                                            .toUpperCase() ||
                                        null,

                                    vehicleModel:
                                        input.vehicleModel
                                            ?.trim() ||
                                        null,

                                    productsTotalPaise,
                                    serviceTotalPaise,
                                    includedTaxPaise,
                                    grandTotalPaise
                                }
                            });

                        for (
                            const line of
                            calculatedProductLines
                            ) {
                            const updateResult =
                                await transaction
                                    .inventoryItem
                                    .updateMany({
                                        where: {
                                            id: line
                                                .inventoryItem
                                                .id,

                                            isActive:
                                                true,

                                            currentStock: {
                                                gte: line
                                                    .input
                                                    .quantity
                                            }
                                        },

                                        data: {
                                            currentStock: {
                                                decrement:
                                                line
                                                    .input
                                                    .quantity
                                            },

                                            version: {
                                                increment:
                                                    1
                                            }
                                        }
                                    });

                            if (
                                updateResult.count !==
                                1
                            ) {
                                throw new OrderCreationError(
                                    "INSUFFICIENT_STOCK",
                                    line.input
                                        .productId
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
                                            currentStock:
                                                true
                                        }
                                    });

                            await transaction
                                .orderItem
                                .create({
                                    data: {
                                        orderId:
                                        createdOrder.id,

                                        inventoryItemId:
                                        line
                                            .inventoryItem
                                            .id,

                                        productIdSnapshot:
                                        line
                                            .inventoryItem
                                            .productId,

                                        billingMatchKeySnapshot:
                                        line
                                            .inventoryItem
                                            .billingMatchKey,

                                        productNameSnapshot:
                                        line
                                            .inventoryItem
                                            .patternAndSize,

                                        quantity:
                                        line.input
                                            .quantity,

                                        standardUnitPricePaise:
                                        line
                                            .inventoryItem
                                            .finalSellingPricePaise,

                                        billedUnitPricePaise:
                                        line.input
                                            .billedUnitPricePaise,

                                        gstRateBasisPoints:
                                        line
                                            .inventoryItem
                                            .gstRateBasisPoints,

                                        includedTaxPaise:
                                        line
                                            .includedTaxPaise,

                                        lineTotalPaise:
                                        line
                                            .lineTotalPaise,

                                        baseCostPaiseSnapshot:
                                        line
                                            .inventoryItem
                                            .baseCostPaise
                                    }
                                });

                            await transaction
                                .stockMovement
                                .create({
                                    data: {
                                        inventoryItemId:
                                        line
                                            .inventoryItem
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
                                        line
                                            .inventoryItem
                                            .baseCostPaise,

                                        referenceNumber:
                                        billNumber,

                                        note:
                                            "Stock deducted from confirmed bill"
                                    }
                                });
                        }

                        for (
                            const line of
                            calculatedServiceLines
                            ) {
                            await transaction
                                .orderServiceLine
                                .create({
                                    data: {
                                        orderId:
                                        createdOrder.id,

                                        serviceIdSnapshot:
                                        line
                                            .catalogueService
                                            .serviceId,

                                        serviceNameSnapshot:
                                        line
                                            .catalogueService
                                            .name,

                                        serviceTypeSnapshot:
                                        line
                                            .catalogueService
                                            .serviceType,

                                        quantity:
                                        line.input
                                            .quantity,

                                        standardUnitPricePaise:
                                        line
                                            .catalogueService
                                            .sellingPricePaise,

                                        billedUnitPricePaise:
                                        line.input
                                            .billedUnitPricePaise,

                                        gstRateBasisPoints:
                                        line
                                            .catalogueService
                                            .gstRateBasisPoints,

                                        includedTaxPaise:
                                        line
                                            .includedTaxPaise,

                                        lineTotalPaise:
                                        line
                                            .lineTotalPaise
                                    }
                                });
                        }

                        if (
                            workshopServiceLines.length >
                            0
                        ) {
                            const serviceNames =
                                workshopServiceLines.map(
                                    (line) =>
                                        line
                                            .catalogueService
                                            .name
                                );

                            const serviceTypes =
                                workshopServiceLines.map(
                                    (line) =>
                                        line
                                            .catalogueService
                                            .serviceType
                                );

                            const jobNumber =
                                `JOB-${Date.now()}-${randomUUID()
                                    .slice(0, 6)
                                    .toUpperCase()}`;

                            await transaction
                                .serviceJob
                                .create({
                                    data: {
                                        jobNumber,

                                        orderId:
                                        createdOrder.id,

                                        createdById,

                                        vehiclePlateNumber:
                                            input
                                                .vehiclePlateNumber!
                                                .trim()
                                                .toUpperCase(),

                                        vehicleModel:
                                            input
                                                .vehicleModel!
                                                .trim(),

                                        serviceType:
                                            determineCombinedServiceType(
                                                serviceTypes
                                            ),

                                        serviceNames
                                    }
                                });
                        }

                        return {
                            id: createdOrder.id,

                            billNumber:
                            createdOrder
                                .billNumber,

                            grandTotalPaise:
                            createdOrder
                                .grandTotalPaise,

                            status:
                            createdOrder.status,

                            alreadyConfirmed:
                                false
                        };
                    }
                );

            return {
                success: true,
                order
            };
        } catch (error: unknown) {
            if (
                error instanceof
                OrderCreationError
            ) {
                return {
                    success: false,
                    reason: error.code,
                    referenceId:
                    error.referenceId
                };
            }

            throw error;
        }
    }
}