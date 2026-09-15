import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import { environment } from "../config/environment.js";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { AuthService } from "../services/AuthService.js";

const authService = new AuthService();

const loginSchema = z.object({
    loginIdentifier: z
        .string()
        .trim()
        .min(1, "Login is required"),

    password: z
        .string()
        .min(1, "Password is required")
});

const changeLoginSchema = z.object({
    newLoginIdentifier: z
        .string()
        .trim()
        .min(3, "Login ID must contain at least 3 characters")
        .max(50, "Login ID is too long")
        .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Use only letters, numbers, dots, underscores or hyphens"
        ),

    currentPassword: z
        .string()
        .min(1, "Current password is required")
});

const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Current password is required"),

        newPassword: z
            .string()
            .min(8, "New password must contain at least 8 characters")
            .max(100, "New password is too long"),

        confirmNewPassword: z
            .string()
            .min(1, "Confirm your new password")
    })
    .refine(
        (data) =>
            data.newPassword === data.confirmNewPassword,
        {
            message: "New passwords do not match",
            path: ["confirmNewPassword"]
        }
    );

export class AuthController {
    async login(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation = loginSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Enter your login and password"
            });

            return;
        }

        try {
            const result = await authService.login(
                validation.data.loginIdentifier,
                validation.data.password
            );

            if (!result) {
                response.status(401).json({
                    success: false,
                    message: "Invalid login or password"
                });

                return;
            }

            response.cookie("mrf_auth_token", result.token, {
                httpOnly: true,
                secure:
                    environment.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 8 * 60 * 60 * 1000
            });

            response.status(200).json({
                success: true,
                user: result.user
            });
        } catch (error: unknown) {
            console.error("Login failed:", error);

            response.status(500).json({
                success: false,
                message: "Unable to log in"
            });
        }
    }

    async currentUser(
        request: Request,
        response: Response
    ): Promise<void> {
        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const user =
                await authService.getAuthenticatedUser(
                    authenticatedRequest.authenticatedUser.id
                );

            if (!user) {
                response.status(401).json({
                    success: false,
                    message: "User account is unavailable"
                });

                return;
            }

            response.status(200).json({
                success: true,
                user
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load current user:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to load your account"
            });
        }
    }

    async changeLoginIdentifier(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            changeLoginSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid account information"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result =
                await authService.changeLoginIdentifier(
                    authenticatedRequest.authenticatedUser.id,
                    validation.data.newLoginIdentifier,
                    validation.data.currentPassword
                );

            if (!result.success) {
                const messages = {
                    USER_NOT_FOUND: "User account not found",
                    INVALID_PASSWORD:
                        "Current password is incorrect",
                    LOGIN_TAKEN:
                        "That login ID is already in use"
                };

                response
                    .status(
                        result.reason === "LOGIN_TAKEN"
                            ? 409
                            : 400
                    )
                    .json({
                        success: false,
                        message: messages[result.reason]
                    });

                return;
            }

            response.status(200).json({
                success: true,
                message: "Login ID changed successfully",
                user: result.user
            });
        } catch (error: unknown) {
            console.error(
                "Unable to change login ID:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to change login ID"
            });
        }
    }

    async changePassword(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            changePasswordSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]?.message ??
                    "Invalid password information"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result = await authService.changePassword(
                authenticatedRequest.authenticatedUser.id,
                validation.data.currentPassword,
                validation.data.newPassword
            );

            if (!result.success) {
                const messages = {
                    USER_NOT_FOUND: "User account not found",
                    INVALID_PASSWORD:
                        "Current password is incorrect",
                    LOGIN_TAKEN:
                        "That login ID is already in use"
                };

                response.status(400).json({
                    success: false,
                    message: messages[result.reason]
                });

                return;
            }

            response.status(200).json({
                success: true,
                message: "Password changed successfully"
            });
        } catch (error: unknown) {
            console.error(
                "Unable to change password:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to change password"
            });
        }
    }

    logout(
        _request: Request,
        response: Response
    ): void {
        response.clearCookie("mrf_auth_token", {
            httpOnly: true,
            secure: environment.NODE_ENV === "production",
            sameSite: "lax"
        });

        response.status(200).json({
            success: true,
            message: "Logged out"
        });
    }
}