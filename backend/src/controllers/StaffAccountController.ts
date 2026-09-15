import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import { UserStatus } from "../generated/prisma/enums.js";
import { StaffAccountService } from "../services/StaffAccountService.js";

const staffAccountService = new StaffAccountService();

const createStaffSchema = z.object({
    displayName: z
        .string()
        .trim()
        .min(2, "Staff name must contain at least 2 characters")
        .max(100, "Staff name is too long"),

    loginIdentifier: z
        .string()
        .trim()
        .min(3, "Login ID must contain at least 3 characters")
        .max(50, "Login ID is too long")
        .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Use only letters, numbers, dots, underscores or hyphens"
        ),

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(100, "Password is too long")
});

const changeStatusSchema = z.object({
    status: z.enum([
        UserStatus.ACTIVE,
        UserStatus.DISABLED
    ])
});

const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .max(100, "Password is too long")
});

export class StaffAccountController {
    async list(
        _request: Request,
        response: Response
    ): Promise<void> {
        try {
            const staff =
                await staffAccountService.listStaff();

            response.status(200).json({
                success: true,
                staff
            });
        } catch (error: unknown) {
            console.error(
                "Unable to list staff accounts:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to load staff accounts"
            });
        }
    }

    async create(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            createStaffSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid staff account information"
            });

            return;
        }

        try {
            const result =
                await staffAccountService.createStaff(
                    validation.data.displayName,
                    validation.data.loginIdentifier,
                    validation.data.password
                );

            if (!result.success) {
                response.status(409).json({
                    success: false,
                    message: "That login ID is already in use"
                });

                return;
            }

            response.status(201).json({
                success: true,
                staff: result.staff
            });
        } catch (error: unknown) {
            console.error(
                "Unable to create staff account:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to create staff account"
            });
        }
    }

    async changeStatus(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            changeStatusSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message: "Select a valid account status"
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
                await staffAccountService.changeStatus(
                    staffId,
                    validation.data.status
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
                "Unable to change staff status:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to change staff status"
            });
        }
    }

    async resetPassword(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            resetPasswordSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid password"
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
            const passwordWasReset =
                await staffAccountService.resetPassword(
                    staffId,
                    validation.data.newPassword
                );

            if (!passwordWasReset) {
                response.status(404).json({
                    success: false,
                    message: "Staff account not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message:
                    "Staff password reset successfully"
            });
        } catch (error: unknown) {
            console.error(
                "Unable to reset staff password:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to reset staff password"
            });
        }
    }
}