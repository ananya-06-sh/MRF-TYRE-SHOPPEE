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

type SupportedFileType =
    | "CSV"
    | "EXCEL";

function getFileType(
    fileName: string
): SupportedFileType | null {
    const normalizedName =
        fileName.trim().toLowerCase();

    if (
        normalizedName.endsWith(
            ".csv"
        )
    ) {
        return "CSV";
    }

    if (
        normalizedName.endsWith(
            ".xlsx"
        )
    ) {
        return "EXCEL";
    }

    return null;
}

export class InventoryImportController {
    async importInventory(
        request: Request,
        response: Response
    ): Promise<void> {
        if (!request.file) {
            response.status(400).json({
                success: false,
                message:
                    "Select a CSV or Excel inventory file"
            });

            return;
        }

        const fileType =
            getFileType(
                request.file.originalname
            );

        if (!fileType) {
            response.status(400).json({
                success: false,
                message:
                    "Only .csv and .xlsx inventory files are supported"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result =
                fileType === "CSV"
                    ? await inventoryImportService
                        .importCsv(
                            request.file
                                .buffer,

                            authenticatedRequest
                                .authenticatedUser
                                .id
                        )
                    : await inventoryImportService
                        .importExcel(
                            request.file
                                .buffer,

                            authenticatedRequest
                                .authenticatedUser
                                .id
                        );

            response.status(200).json({
                success: true,

                message:
                    fileType === "CSV"
                        ? "CSV inventory imported successfully"
                        : "Excel inventory imported successfully",

                fileType,

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
                "Inventory import failed:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to import inventory"
            });
        }
    }

    async importCsv(
        request: Request,
        response: Response
    ): Promise<void> {
        await this.importInventory(
            request,
            response
        );
    }
}