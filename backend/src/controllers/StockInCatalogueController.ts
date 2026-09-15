import type {
    Request,
    Response
} from "express";
import { database } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";

export class StockInCatalogueController {
    async list(
        request: Request,
        response: Response
    ): Promise<void> {
        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
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
                        category: true,
                        currentStock: true,
                        lowStockTrigger: true,
                        baseCostPaise: true,
                        gstRateBasisPoints: true,
                        finalSellingPricePaise: true
                    },
                    orderBy: {
                        patternAndSize: "asc"
                    }
                });

            const isAdmin =
                authenticatedRequest
                    .authenticatedUser
                    .role === "ADMIN";

            const inventory = items.map((item) => {
                if (!isAdmin) {
                    return {
                        id: item.id,
                        productId: item.productId,
                        billingMatchKey:
                        item.billingMatchKey,
                        patternAndSize:
                        item.patternAndSize,
                        category: item.category,
                        currentStock:
                        item.currentStock,
                        lowStockTrigger:
                        item.lowStockTrigger
                    };
                }

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

            response.status(200).json({
                success: true,
                inventory
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load Stock-In catalogue:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to load inventory"
            });
        }
    }
}