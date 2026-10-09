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

export interface StockAdjustmentInput {
    inventoryItemId: string;
    newStock: number;
    reason: string;
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
    async listMovements(limit = 100) {
        return database.stockMovement.findMany({
            select: {
                id: true,
                type: true,
                quantityChange: true,
                stockBefore: true,
                stockAfter: true,
                supplierName: true,
                referenceNumber: true,
                note: true,
                occurredAt: true,
                inventoryItem: {
                    select: {
                        productId: true,
                        patternAndSize: true
                    }
                },
                performedBy: {
                    select: {
                        displayName: true
                    }
                }
            },
            orderBy: {
                occurredAt: "desc"
            },
            take: Math.min(Math.max(limit, 1), 500)
        });
    }

    async adjustStock(
        performedById: string,
        input: StockAdjustmentInput
    ) {
        return database.$transaction(
            async (transaction) => {
                const item =
                    await transaction.inventoryItem.findUnique({
                        where: {
                            id: input.inventoryItemId
                        },
                        select: {
                            id: true,
                            productId: true,
                            patternAndSize: true,
                            currentStock: true,
                            baseCostPaise: true
                        }
                    });

                if (!item) {
                    return null;
                }

                const quantityChange =
                    input.newStock - item.currentStock;

                if (quantityChange === 0) {
                    return {
                        ...item,
                        currentStock: input.newStock
                    };
                }

                const updated =
                    await transaction.inventoryItem.update({
                        where: {
                            id: item.id
                        },
                        data: {
                            currentStock: input.newStock,
                            version: {
                                increment: 1
                            }
                        },
                        select: {
                            id: true,
                            productId: true,
                            patternAndSize: true,
                            currentStock: true
                        }
                    });

                await transaction.stockMovement.create({
                    data: {
                        inventoryItemId: item.id,
                        performedById,
                        type: StockMovementType.ADJUSTMENT,
                        quantityChange,
                        stockBefore: item.currentStock,
                        stockAfter: input.newStock,
                        unitCostPaise: item.baseCostPaise,
                        note: input.reason.trim()
                    }
                });

                return updated;
            }
        );
    }

    async listAdminInventory(
        includeInactive = false
    ): Promise<
        AdminInventoryItem[]
    > {
        const items =
            await database.inventoryItem.findMany({
                where: includeInactive
                    ? undefined
                    : {
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
