import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { OrderHistoryService } from "../services/OrderHistoryService.js";

const orderHistoryService =
    new OrderHistoryService();

const orderIdSchema =
    z.string().uuid();

export class OrderHistoryController {
    async cancelOrder(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            orderIdSchema.safeParse(
                request.params.orderId
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    "Invalid order ID"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result =
                await orderHistoryService
                    .cancelOrder(
                        validation.data,
                        authenticatedRequest
                            .authenticatedUser.id
                    );

            if (!result.success) {
                if (
                    result.reason ===
                    "ORDER_NOT_FOUND"
                ) {
                    response.status(404).json({
                        success: false,
                        message:
                            "Bill was not found"
                    });

                    return;
                }

                response.status(409).json({
                    success: false,
                    message:
                        "This bill was already sent to Tally and cannot be cancelled directly"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message:
                    result.restoredQuantity > 0
                        ? result.alreadyCancelled
                            ? `Bill was already cancelled; ${result.restoredQuantity} missing tyre(s) were restored now`
                            : `Bill cancelled and ${result.restoredQuantity} tyre(s) restored successfully`
                        : "Bill is cancelled and its stock was already restored",
                restoredQuantity:
                    result.restoredQuantity
            });
        } catch (error: unknown) {
            console.error(
                "Unable to cancel order:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to cancel the bill"
            });
        }
    }

    async listOrders(
        request: Request,
        response: Response
    ): Promise<void> {
        try {
            const searchText =
                typeof request.query
                    .search === "string"
                    ? request.query.search
                    : "";

            const orders =
                await orderHistoryService
                    .listOrders(
                        searchText
                    );

            response.status(200).json({
                success: true,
                orders
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load order history:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to load bill history"
            });
        }
    }

    async getOrder(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            orderIdSchema.safeParse(
                request.params.orderId
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    "Invalid order ID"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        const authenticatedUser =
            authenticatedRequest
                .authenticatedUser;

        const canViewAllOrders =
            authenticatedUser.role ===
            "ADMIN";

        try {
            const order =
                await orderHistoryService
                    .getOrderById(
                        validation.data,
                        authenticatedUser.id,
                        canViewAllOrders
                    );

            if (!order) {
                response.status(404).json({
                    success: false,
                    message:
                        "Bill was not found or you do not have permission to view it"
                });

                return;
            }

            response.status(200).json({
                success: true,
                order
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load order:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to load bill details"
            });
        }
    }
}
