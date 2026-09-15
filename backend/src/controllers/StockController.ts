import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { StockService } from "../services/StockService.js";

const stockService = new StockService();

const stockInSchema = z.object({
    inventoryItemId: z
        .string()
        .uuid("Select a valid tyre"),

    quantity: z
        .number()
        .int("Quantity must be a whole number")
        .positive("Quantity must be greater than zero")
        .max(10000, "Quantity is too large"),

    supplierName: z
        .string()
        .trim()
        .max(100, "Supplier name is too long")
        .optional(),

    referenceNumber: z
        .string()
        .trim()
        .max(100, "Invoice number is too long")
        .optional(),

    note: z
        .string()
        .trim()
        .max(500, "Note is too long")
        .optional(),

    occurredAt: z
        .string()
        .optional(),

    newBaseCostRupees: z
        .number()
        .positive("Cost price must be greater than zero")
        .optional(),

    newSellingPriceRupees: z
        .number()
        .positive("Selling price must be greater than zero")
        .optional()
});

export class StockController {
    async stockIn(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            stockInSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid stock information"
            });

            return;
        }

        let occurredAt: Date | undefined;

        if (validation.data.occurredAt) {
            occurredAt =
                new Date(validation.data.occurredAt);

            if (Number.isNaN(occurredAt.getTime())) {
                response.status(400).json({
                    success: false,
                    message: "Select a valid receipt date"
                });

                return;
            }
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        const isAdmin =
            authenticatedRequest.authenticatedUser.role ===
            "ADMIN";

        if (
            !isAdmin &&
            (validation.data.newBaseCostRupees !== undefined ||
                validation.data.newSellingPriceRupees !==
                undefined)
        ) {
            response.status(403).json({
                success: false,
                message:
                    "Only an Admin can change cost or selling prices"
            });

            return;
        }

        try {
            const result = await stockService.stockIn(
                authenticatedRequest.authenticatedUser.id,
                {
                    inventoryItemId:
                    validation.data.inventoryItemId,
                    quantity:
                    validation.data.quantity,
                    supplierName:
                    validation.data.supplierName,
                    referenceNumber:
                    validation.data.referenceNumber,
                    note:
                    validation.data.note,
                    occurredAt,
                    newBaseCostPaise:
                        validation.data
                            .newBaseCostRupees !== undefined
                            ? Math.round(
                                validation.data
                                    .newBaseCostRupees * 100
                            )
                            : undefined,
                    newSellingPricePaise:
                        validation.data
                            .newSellingPriceRupees !== undefined
                            ? Math.round(
                                validation.data
                                    .newSellingPriceRupees *
                                100
                            )
                            : undefined
                }
            );

            if (!result.success) {
                response.status(404).json({
                    success: false,
                    message: "Tyre was not found"
                });

                return;
            }

            response.status(201).json({
                success: true,
                message: "Stock added successfully",
                inventoryItem: result.inventoryItem
            });
        } catch (error: unknown) {
            console.error("Stock-In failed:", error);

            response.status(500).json({
                success: false,
                message: "Unable to add stock"
            });
        }
    }
}