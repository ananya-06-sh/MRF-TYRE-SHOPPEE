import { database } from "../config/database.js";
import {
    StockMovementType,
    type TyreCategory
} from "../generated/prisma/enums.js";

export interface CreateInventoryInput {
    productId: string;
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category: TyreCategory;
    compatibleVehicles: string[];
    openingStock: number;
    lowStockTrigger: number;
    baseCostPaise: number;
    finalSellingPricePaise: number;
}

export interface UpdateInventoryInput {
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category: TyreCategory;
    compatibleVehicles: string[];
    lowStockTrigger: number;
    baseCostPaise: number;
    finalSellingPricePaise: number;
}

export type CreateInventoryResult =
    | {
    success: true;
    inventoryItemId: string;
}
    | {
    success: false;
    reason:
        | "PRODUCT_ID_TAKEN"
        | "BILLING_KEY_TAKEN";
};

export class AdminInventoryService {
    async createInventoryItem(
        performedById: string,
        input: CreateInventoryInput
    ): Promise<CreateInventoryResult> {
        const productId =
            input.productId.trim().toUpperCase();

        const billingMatchKey =
            input.billingMatchKey.trim();

        const existingProduct =
            await database.inventoryItem.findUnique({
                where: {
                    productId
                }
            });

        if (existingProduct) {
            return {
                success: false,
                reason: "PRODUCT_ID_TAKEN"
            };
        }

        const existingBillingKey =
            await database.inventoryItem.findUnique({
                where: {
                    billingMatchKey
                }
            });

        if (existingBillingKey) {
            return {
                success: false,
                reason: "BILLING_KEY_TAKEN"
            };
        }

        return database.$transaction(
            async (transaction) => {
                const inventoryItem =
                    await transaction.inventoryItem.create({
                        data: {
                            productId,
                            billingMatchKey,
                            patternAndSize:
                                input.patternAndSize.trim(),
                            normalizedSize:
                                input.normalizedSize
                                    .trim()
                                    .toUpperCase(),
                            category: input.category,
                            compatibleVehicles:
                                this.cleanVehicleNames(
                                    input.compatibleVehicles
                                ),
                            currentStock:
                            input.openingStock,
                            lowStockTrigger:
                            input.lowStockTrigger,
                            baseCostPaise:
                            input.baseCostPaise,
                            gstRateBasisPoints: 2800,
                            finalSellingPricePaise:
                            input.finalSellingPricePaise,
                            isActive: true
                        }
                    });

                if (input.openingStock > 0) {
                    await transaction.stockMovement.create({
                        data: {
                            inventoryItemId:
                            inventoryItem.id,
                            performedById,
                            type:
                            StockMovementType.OPENING_STOCK,
                            quantityChange:
                            input.openingStock,
                            stockBefore: 0,
                            stockAfter:
                            input.openingStock,
                            unitCostPaise:
                            input.baseCostPaise,
                            note:
                                "Opening stock recorded when product was created"
                        }
                    });
                }

                return {
                    success: true,
                    inventoryItemId:
                    inventoryItem.id
                };
            }
        );
    }

    async updateInventoryItem(
        inventoryItemId: string,
        input: UpdateInventoryInput
    ): Promise<boolean> {
        const existingItem =
            await database.inventoryItem.findUnique({
                where: {
                    id: inventoryItemId
                }
            });

        if (!existingItem) {
            return false;
        }

        const conflictingBillingKey =
            await database.inventoryItem.findFirst({
                where: {
                    billingMatchKey:
                        input.billingMatchKey.trim(),
                    id: {
                        not: inventoryItemId
                    }
                }
            });

        if (conflictingBillingKey) {
            throw new Error("BILLING_KEY_TAKEN");
        }

        await database.inventoryItem.update({
            where: {
                id: inventoryItemId
            },
            data: {
                billingMatchKey:
                    input.billingMatchKey.trim(),
                patternAndSize:
                    input.patternAndSize.trim(),
                normalizedSize:
                    input.normalizedSize
                        .trim()
                        .toUpperCase(),
                category: input.category,
                compatibleVehicles:
                    this.cleanVehicleNames(
                        input.compatibleVehicles
                    ),
                lowStockTrigger:
                input.lowStockTrigger,
                baseCostPaise:
                input.baseCostPaise,
                finalSellingPricePaise:
                input.finalSellingPricePaise,
                version: {
                    increment: 1
                }
            }
        });

        return true;
    }

    async setInventoryItemActive(
        inventoryItemId: string,
        isActive: boolean
    ): Promise<boolean> {
        const existingItem =
            await database.inventoryItem.findUnique({
                where: {
                    id: inventoryItemId
                }
            });

        if (!existingItem) {
            return false;
        }

        await database.inventoryItem.update({
            where: {
                id: inventoryItemId
            },
            data: {
                isActive,
                version: {
                    increment: 1
                }
            }
        });

        return true;
    }

    private cleanVehicleNames(
        vehicleNames: string[]
    ): string[] {
        return [
            ...new Set(
                vehicleNames
                    .map((name) => name.trim())
                    .filter((name) => name.length > 0)
            )
        ];
    }
}