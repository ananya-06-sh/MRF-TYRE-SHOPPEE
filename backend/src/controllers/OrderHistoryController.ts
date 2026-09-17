import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import { OrderHistoryService } from "../services/OrderHistoryService.js";

const orderHistoryService = new OrderHistoryService();

const orderIdSchema = z.string().uuid();

export class OrderHistoryController {
    async listOrders(
        request: Request,
        response: Response
    ): Promise<void> {
        try {
            const searchText =
                typeof request.query.search === "string"
                    ? request.query.search
                    : "";

            const orders =
                await orderHistoryService.listOrders(
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
                message: "Unable to load bill history"
            });
        }
    }

    async getOrder(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation = orderIdSchema.safeParse(
            request.params.orderId
        );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message: "Invalid order ID"
            });

            return;
        }

        try {
            const order =
                await orderHistoryService.getOrderById(
                    validation.data
                );

            if (!order) {
                response.status(404).json({
                    success: false,
                    message: "Bill was not found"
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
                message: "Unable to load bill details"
            });
        }
    }
}