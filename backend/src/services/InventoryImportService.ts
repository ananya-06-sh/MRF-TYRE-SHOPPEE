import { parse } from "csv-parse/sync";
import { z } from "zod";
import { database } from "../config/database.js";
import {
    StockMovementType,
    TyreCategory
} from "../generated/prisma/enums.js";

function numberField(name: string) {
    return z
        .string()
        .trim()
        .min(1, `${name} is required`)
        .refine(
            (value) => Number.isFinite(Number(value)),
            `${name} must be a number`
        )
        .transform(Number);
}

const inventoryRowSchema = z.object({
    productId: z
        .string()
        .trim()
        .min(1, "productId is required"),

    billingMatchKey: z
        .string()
        .trim()
        .min(1, "billingMatchKey is required"),

    patternAndSize: z
        .string()
        .trim()
        .min(1, "patternAndSize is required"),

    normalizedSize: z
        .string()
        .trim()
        .min(1, "normalizedSize is required"),

    category: z.nativeEnum(TyreCategory),

    compatibleVehicles: z
        .string()
        .optional()
        .default(""),

    currentStock: numberField("currentStock")
        .refine(
            Number.isInteger,
            "currentStock must be a whole number"
        )
        .refine(
            (value) => value >= 0,
            "currentStock cannot be negative"
        ),

    lowStockTrigger: numberField("lowStockTrigger")
        .refine(
            Number.isInteger,
            "lowStockTrigger must be a whole number"
        )
        .refine(
            (value) => value >= 0,
            "lowStockTrigger cannot be negative"
        ),

    baseCost: numberField("baseCost")
        .refine(
            (value) => value >= 0,
            "baseCost cannot be negative"
        ),

    gstRatePercent: numberField("gstRatePercent")
        .refine(
            (value) => value >= 0 && value <= 100,
            "gstRatePercent must be between 0 and 100"
        ),

    finalSellingPrice: numberField(
        "finalSellingPrice"
    ).refine(
        (value) => value >= 0,
        "finalSellingPrice cannot be negative"
    )
});

interface ParsedInventoryRow {
    rowNumber: number;
    productId: string;
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category: TyreCategory;
    compatibleVehicles: string[];
    currentStock: number;
    lowStockTrigger: number;
    baseCostPaise: number;
    gstRateBasisPoints: number;
    finalSellingPricePaise: number;
}

export interface InventoryImportResult {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
    stockMovementCount: number;
}

export class InventoryImportValidationError extends Error {
    constructor(
        public readonly issues: string[]
    ) {
        super("Inventory CSV validation failed");
    }
}

export class InventoryImportService {
    async importCsv(
        fileBuffer: Buffer,
        performedById: string
    ): Promise<InventoryImportResult> {
        const rawRows = this.parseCsv(fileBuffer);
        const rows = this.validateRows(rawRows);

        return database.$transaction(
            async (transaction) => {
                let createdCount = 0;
                let updatedCount = 0;
                let stockMovementCount = 0;

                for (const row of rows) {
                    const matchingItems =
                        await transaction.inventoryItem.findMany({
                            where: {
                                OR: [
                                    {
                                        productId:
                                        row.productId
                                    },
                                    {
                                        billingMatchKey:
                                        row.billingMatchKey
                                    }
                                ]
                            }
                        });

                    if (matchingItems.length > 1) {
                        throw new InventoryImportValidationError([
                            `Row ${row.rowNumber}: productId and billingMatchKey belong to different inventory items`
                        ]);
                    }

                    const existingItem =
                        matchingItems[0];

                    if (
                        existingItem &&
                        existingItem.productId !==
                        row.productId
                    ) {
                        throw new InventoryImportValidationError([
                            `Row ${row.rowNumber}: billingMatchKey "${row.billingMatchKey}" is already used by product "${existingItem.productId}"`
                        ]);
                    }

                    if (
                        existingItem &&
                        existingItem.billingMatchKey !==
                        row.billingMatchKey
                    ) {
                        throw new InventoryImportValidationError([
                            `Row ${row.rowNumber}: productId "${row.productId}" already uses another billingMatchKey`
                        ]);
                    }

                    if (!existingItem) {
                        const createdItem =
                            await transaction.inventoryItem.create({
                                data: {
                                    productId:
                                    row.productId,
                                    billingMatchKey:
                                    row.billingMatchKey,
                                    patternAndSize:
                                    row.patternAndSize,
                                    normalizedSize:
                                    row.normalizedSize,
                                    category:
                                    row.category,
                                    compatibleVehicles:
                                    row.compatibleVehicles,
                                    currentStock:
                                    row.currentStock,
                                    lowStockTrigger:
                                    row.lowStockTrigger,
                                    baseCostPaise:
                                    row.baseCostPaise,
                                    gstRateBasisPoints:
                                    row.gstRateBasisPoints,
                                    finalSellingPricePaise:
                                    row.finalSellingPricePaise,
                                    isActive: true
                                }
                            });

                        createdCount += 1;

                        if (row.currentStock > 0) {
                            await transaction.stockMovement.create({
                                data: {
                                    inventoryItemId:
                                    createdItem.id,
                                    performedById,
                                    type:
                                    StockMovementType
                                        .OPENING_STOCK,
                                    quantityChange:
                                    row.currentStock,
                                    stockBefore: 0,
                                    stockAfter:
                                    row.currentStock,
                                    unitCostPaise:
                                    row.baseCostPaise,
                                    referenceNumber:
                                        "CSV-IMPORT",
                                    note:
                                        "Opening stock imported from inventory CSV"
                                }
                            });

                            stockMovementCount += 1;
                        }

                        continue;
                    }

                    const stockBefore =
                        existingItem.currentStock;

                    const quantityChange =
                        row.currentStock -
                        stockBefore;

                    await transaction.inventoryItem.update({
                        where: {
                            id: existingItem.id
                        },
                        data: {
                            patternAndSize:
                            row.patternAndSize,
                            normalizedSize:
                            row.normalizedSize,
                            category:
                            row.category,
                            compatibleVehicles:
                            row.compatibleVehicles,
                            currentStock:
                            row.currentStock,
                            lowStockTrigger:
                            row.lowStockTrigger,
                            baseCostPaise:
                            row.baseCostPaise,
                            gstRateBasisPoints:
                            row.gstRateBasisPoints,
                            finalSellingPricePaise:
                            row.finalSellingPricePaise,
                            isActive: true,
                            version: {
                                increment: 1
                            }
                        }
                    });

                    updatedCount += 1;

                    if (quantityChange !== 0) {
                        await transaction.stockMovement.create({
                            data: {
                                inventoryItemId:
                                existingItem.id,
                                performedById,
                                type:
                                StockMovementType
                                    .ADJUSTMENT,
                                quantityChange,
                                stockBefore,
                                stockAfter:
                                row.currentStock,
                                unitCostPaise:
                                row.baseCostPaise,
                                referenceNumber:
                                    "CSV-IMPORT",
                                note:
                                    "Stock quantity updated from inventory CSV"
                            }
                        });

                        stockMovementCount += 1;
                    }
                }

                return {
                    totalRows: rows.length,
                    createdCount,
                    updatedCount,
                    stockMovementCount
                };
            },
            {
                timeout: 30_000
            }
        );
    }

    private parseCsv(
        fileBuffer: Buffer
    ): Record<string, string>[] {
        try {
            return parse(fileBuffer, {
                bom: true,
                columns: true,
                skip_empty_lines: true,
                trim: true
            }) as Record<string, string>[];
        } catch {
            throw new InventoryImportValidationError([
                "The CSV file could not be read. Check that it is a valid CSV file."
            ]);
        }
    }

    private validateRows(
        rawRows: Record<string, string>[]
    ): ParsedInventoryRow[] {
        if (rawRows.length === 0) {
            throw new InventoryImportValidationError([
                "The CSV file contains no inventory rows."
            ]);
        }

        const issues: string[] = [];
        const productIds = new Set<string>();
        const billingMatchKeys = new Set<string>();
        const parsedRows: ParsedInventoryRow[] = [];

        rawRows.forEach((rawRow, index) => {
            const rowNumber = index + 2;
            const validation =
                inventoryRowSchema.safeParse(rawRow);

            if (!validation.success) {
                validation.error.issues.forEach(
                    (issue) => {
                        issues.push(
                            `Row ${rowNumber}: ${issue.message}`
                        );
                    }
                );

                return;
            }

            const row = validation.data;
            const normalizedProductId =
                row.productId.trim();

            const normalizedBillingMatchKey =
                row.billingMatchKey.trim();

            if (productIds.has(normalizedProductId)) {
                issues.push(
                    `Row ${rowNumber}: duplicate productId "${normalizedProductId}" in the CSV`
                );
            }

            if (
                billingMatchKeys.has(
                    normalizedBillingMatchKey
                )
            ) {
                issues.push(
                    `Row ${rowNumber}: duplicate billingMatchKey "${normalizedBillingMatchKey}" in the CSV`
                );
            }

            productIds.add(normalizedProductId);
            billingMatchKeys.add(
                normalizedBillingMatchKey
            );

            parsedRows.push({
                rowNumber,
                productId:
                normalizedProductId,
                billingMatchKey:
                normalizedBillingMatchKey,
                patternAndSize:
                    row.patternAndSize.trim(),
                normalizedSize:
                    row.normalizedSize.trim(),
                category:
                row.category,
                compatibleVehicles:
                    row.compatibleVehicles
                        .split("|")
                        .map((vehicle) =>
                            vehicle.trim()
                        )
                        .filter(Boolean),
                currentStock:
                row.currentStock,
                lowStockTrigger:
                row.lowStockTrigger,
                baseCostPaise:
                    Math.round(row.baseCost * 100),
                gstRateBasisPoints:
                    Math.round(
                        row.gstRatePercent * 100
                    ),
                finalSellingPricePaise:
                    Math.round(
                        row.finalSellingPrice * 100
                    )
            });
        });

        if (issues.length > 0) {
            throw new InventoryImportValidationError(
                issues
            );
        }

        return parsedRows;
    }
}