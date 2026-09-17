import type {
    Request,
    Response
} from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import {
    InventoryImportService,
    InventoryImportValidationError
} from "../services/InventoryImportService.js";

const inventoryImportService =
    new InventoryImportService();

export class InventoryImportController {
    async importCsv(
        request: Request,
        response: Response
    ): Promise<void> {
        if (!request.file) {
            response.status(400).json({
                success: false,
                message: "Select a CSV inventory file"
            });

            return;
        }

        if (
            !request.file.originalname
                .toLowerCase()
                .endsWith(".csv")
        ) {
            response.status(400).json({
                success: false,
                message:
                    "Only CSV inventory files are supported"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result =
                await inventoryImportService.importCsv(
                    request.file.buffer,
                    authenticatedRequest
                        .authenticatedUser.id
                );

            response.status(200).json({
                success: true,
                message: "Inventory imported successfully",
                result
            });
        } catch (error: unknown) {
            if (
                error instanceof
                InventoryImportValidationError
            ) {
                response.status(400).json({
                    success: false,
                    message:
                        "The inventory file contains invalid data",
                    issues: error.issues
                });

                return;
            }

            console.error(
                "Inventory CSV import failed:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to import inventory"
            });
        }
    }
}