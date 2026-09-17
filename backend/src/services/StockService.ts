import { database } from "../config/database.js";
import { StockMovementType } from "../generated/prisma/enums.js";

export interface AdminInventoryItem {
    id: string;
    productId: string;
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category:
        | "TWO_WHEELER"
        | "PASSENGER_CAR"
        | "COMMERCIAL";
    compatibleVehicles: string[];
    currentStock: number;
    lowStockTrigger: number;
    baseCostPaise: number;
    gstRateBasisPoints: number;
    totalCostPaise: number;
    finalSellingPricePaise: number;
    profitPaise: number;
    isActive: boolean;
}

export interface StockInInput {
    inventoryItemId: string;
    quantity: number;
    supplierName?: string;
    referenceNumber?: string;
    note?: string;
    occurredAt?: Date;
    newBaseCostPaise?: number;
    newSellingPricePaise?: number;
}

export type StockInResult =
    | {
    success: true;
    inventoryItem: {
        id: string;
        productId: string;
        patternAndSize: string;
        currentStock: number;
        baseCostPaise: number;
        finalSellingPricePaise: number;
    };
}
    | {
    success: false;
    reason: "ITEM_NOT_FOUND";
};

export class StockService {
    async listAdminInventory(): Promise<
        AdminInventoryItem[]
    > {
        const items =
            await database.inventoryItem.findMany({
                where: {
                    isActive: true
                },
                select: {
                    id: true,
                    productId: true,
                    billingMatchKey: true,
                    patternAndSize: true,
                    normalizedSize: true,
                    category: true,
                    compatibleVehicles: true,
                    currentStock: true,
                    lowStockTrigger: true,
                    baseCostPaise: true,
                    gstRateBasisPoints: true,
                    finalSellingPricePaise: true,
                    isActive: true
                },
                orderBy: {
                    patternAndSize: "asc"
                }
            });

        return items.map((item) => {
            const totalCostPaise = Math.round(
                item.baseCostPaise *
                (1 +
                    item.gstRateBasisPoints /
                    10000)
            );

            return {
                ...item,
                totalCostPaise,
                profitPaise:
                    item.finalSellingPricePaise -
                    totalCostPaise
            };
        });
    }

    async stockIn(
        performedById: string,
        input: StockInInput
    ): Promise<StockInResult> {
        return database.$transaction(
            async (transaction) => {
                const existingItem =
                    await transaction.inventoryItem.findFirst(
                        {
                            where: {
                                id: input.inventoryItemId,
                                isActive: true
                            }
                        }
                    );

                if (!existingItem) {
                    return {
                        success: false,
                        reason: "ITEM_NOT_FOUND"
                    };
                }

                const updatedItem =
                    await transaction.inventoryItem.update({
                        where: {
                            id: existingItem.id
                        },
                        data: {
                            currentStock: {
                                increment: input.quantity
                            },
                            version: {
                                increment: 1
                            },
                            ...(input.newBaseCostPaise !==
                            undefined
                                ? {
                                    baseCostPaise:
                                    input.newBaseCostPaise
                                }
                                : {}),
                            ...(input.newSellingPricePaise !==
                            undefined
                                ? {
                                    finalSellingPricePaise:
                                    input.newSellingPricePaise
                                }
                                : {})
                        },
                        select: {
                            id: true,
                            productId: true,
                            patternAndSize: true,
                            currentStock: true,
                            baseCostPaise: true,
                            finalSellingPricePaise: true
                        }
                    });

                const stockBefore =
                    updatedItem.currentStock -
                    input.quantity;

                await transaction.stockMovement.create({
                    data: {
                        inventoryItemId:
                        updatedItem.id,
                        performedById,
                        type:
                        StockMovementType.STOCK_IN,
                        quantityChange:
                        input.quantity,
                        stockBefore,
                        stockAfter:
                        updatedItem.currentStock,
                        unitCostPaise:
                        updatedItem.baseCostPaise,
                        supplierName:
                            input.supplierName?.trim() ||
                            null,
                        referenceNumber:
                            input.referenceNumber?.trim() ||
                            null,
                        note:
                            input.note?.trim() ||
                            null,
                        occurredAt:
                            input.occurredAt ??
                            new Date()
                    }
                });

                return {
                    success: true,
                    inventoryItem: updatedItem
                };
            }
        );
    }
}