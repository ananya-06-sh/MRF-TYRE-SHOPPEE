import type {
    Request,
    Response
} from "express";
import { StockService } from "../services/StockService.js";

const stockService = new StockService();

export class AdminInventoryController {
    async list(
        _request: Request,
        response: Response
    ): Promise<void> {
        try {
            const inventory =
                await stockService.listAdminInventory();

            response.status(200).json({
                success: true,
                inventory
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load Admin inventory:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to load inventory"
            });
        }
    }
}