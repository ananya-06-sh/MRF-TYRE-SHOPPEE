import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { AdminInventoryService } from "../services/AdminInventoryService.js";

const adminInventoryService =
    new AdminInventoryService();

const inventoryFieldsSchema = z.object({
    billingMatchKey: z
        .string()
        .trim()
        .min(1, "Billing match key is required")
        .max(150, "Billing match key is too long"),

    patternAndSize: z
        .string()
        .trim()
        .min(3, "Tyre name and size are required")
        .max(150, "Tyre name is too long"),

    normalizedSize: z
        .string()
        .trim()
        .min(3, "Tyre size is required")
        .max(50, "Tyre size is too long"),

    category: z.enum([
        "TWO_WHEELER",
        "PASSENGER_CAR",
        "COMMERCIAL"
    ]),

    compatibleVehicles: z
        .array(
            z
                .string()
                .trim()
                .min(1)
                .max(100)
        )
        .max(100),

    lowStockTrigger: z
        .number()
        .int()
        .min(0, "Low-stock trigger cannot be negative")
        .max(10000),

    baseCostRupees: z
        .number()
        .positive("Base cost must be greater than zero"),

    finalSellingPriceRupees: z
        .number()
        .positive("Selling price must be greater than zero")
});

const createInventorySchema =
    inventoryFieldsSchema.extend({
        productId: z
            .string()
            .trim()
            .min(1, "Product ID is required")
            .max(50, "Product ID is too long"),

        openingStock: z
            .number()
            .int()
            .min(0, "Opening stock cannot be negative")
            .max(100000)
    });

const activeStatusSchema = z.object({
    isActive: z.boolean()
});

export class AdminInventoryManagementController {
    async create(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            createInventorySchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid inventory information"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result =
                await adminInventoryService
                    .createInventoryItem(
                        authenticatedRequest
                            .authenticatedUser.id,
                        {
                            productId:
                            validation.data.productId,
                            billingMatchKey:
                            validation.data
                                .billingMatchKey,
                            patternAndSize:
                            validation.data
                                .patternAndSize,
                            normalizedSize:
                            validation.data
                                .normalizedSize,
                            category:
                            validation.data.category,
                            compatibleVehicles:
                            validation.data
                                .compatibleVehicles,
                            openingStock:
                            validation.data
                                .openingStock,
                            lowStockTrigger:
                            validation.data
                                .lowStockTrigger,
                            baseCostPaise:
                                Math.round(
                                    validation.data
                                        .baseCostRupees *
                                    100
                                ),
                            finalSellingPricePaise:
                                Math.round(
                                    validation.data
                                        .finalSellingPriceRupees *
                                    100
                                )
                        }
                    );

            if (!result.success) {
                response.status(409).json({
                    success: false,
                    message:
                        result.reason ===
                        "PRODUCT_ID_TAKEN"
                            ? "That Product ID already exists"
                            : "That billing match key already exists"
                });

                return;
            }

            response.status(201).json({
                success: true,
                message: "Tyre created successfully",
                inventoryItemId:
                result.inventoryItemId
            });
        } catch (error: unknown) {
            console.error(
                "Unable to create tyre:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to create tyre"
            });
        }
    }

    async update(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            inventoryFieldsSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid inventory information"
            });

            return;
        }

        const inventoryItemId =
            request.params.inventoryItemId;

        if (typeof inventoryItemId !== "string") {
            response.status(400).json({
                success: false,
                message: "Invalid tyre ID"
            });

            return;
        }

        try {
            const updated =
                await adminInventoryService
                    .updateInventoryItem(
                        inventoryItemId,
                        {
                            billingMatchKey:
                            validation.data
                                .billingMatchKey,
                            patternAndSize:
                            validation.data
                                .patternAndSize,
                            normalizedSize:
                            validation.data
                                .normalizedSize,
                            category:
                            validation.data.category,
                            compatibleVehicles:
                            validation.data
                                .compatibleVehicles,
                            lowStockTrigger:
                            validation.data
                                .lowStockTrigger,
                            baseCostPaise:
                                Math.round(
                                    validation.data
                                        .baseCostRupees *
                                    100
                                ),
                            finalSellingPricePaise:
                                Math.round(
                                    validation.data
                                        .finalSellingPriceRupees *
                                    100
                                )
                        }
                    );

            if (!updated) {
                response.status(404).json({
                    success: false,
                    message: "Tyre was not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message: "Tyre updated successfully"
            });
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                error.message ===
                "BILLING_KEY_TAKEN"
            ) {
                response.status(409).json({
                    success: false,
                    message:
                        "That billing match key already exists"
                });

                return;
            }

            console.error(
                "Unable to update tyre:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to update tyre"
            });
        }
    }

    async changeActiveStatus(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            activeStatusSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message: "Select a valid product status"
            });

            return;
        }

        const inventoryItemId =
            request.params.inventoryItemId;

        if (typeof inventoryItemId !== "string") {
            response.status(400).json({
                success: false,
                message: "Invalid tyre ID"
            });

            return;
        }

        try {
            const updated =
                await adminInventoryService
                    .setInventoryItemActive(
                        inventoryItemId,
                        validation.data.isActive
                    );

            if (!updated) {
                response.status(404).json({
                    success: false,
                    message: "Tyre was not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message: validation.data.isActive
                    ? "Tyre enabled successfully"
                    : "Tyre disabled successfully"
            });
        } catch (error: unknown) {
            console.error(
                "Unable to change tyre status:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to change tyre status"
            });
        }
    }
}