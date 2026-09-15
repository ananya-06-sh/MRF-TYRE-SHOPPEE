import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import { StaffAccountService } from "../services/StaffAccountService.js";

const staffAccountService =
    new StaffAccountService();

const permissionSchema = z.object({
    canStockIn: z.boolean()
});

export class StaffPermissionController {
    async changeStockInPermission(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            permissionSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message: "Select a valid Stock-In permission"
            });

            return;
        }

        const staffId = request.params.staffId;

        if (typeof staffId !== "string") {
            response.status(400).json({
                success: false,
                message: "Invalid staff account ID"
            });

            return;
        }

        try {
            const staff =
                await staffAccountService
                    .changeStockInPermission(
                        staffId,
                        validation.data.canStockIn
                    );

            if (!staff) {
                response.status(404).json({
                    success: false,
                    message: "Staff account not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                staff
            });
        } catch (error: unknown) {
            console.error(
                "Unable to change Stock-In permission:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to change Stock-In permission"
            });
        }
    }
}