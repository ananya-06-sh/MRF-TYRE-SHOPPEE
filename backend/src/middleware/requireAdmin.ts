import type {
    NextFunction,
    Request,
    Response
} from "express";
import type { AuthenticatedRequest } from "./authenticate.js";

export function requireAdmin(
    request: Request,
    response: Response,
    next: NextFunction
): void {
    const authenticatedRequest =
        request as AuthenticatedRequest;

    if (
        !authenticatedRequest.authenticatedUser ||
        authenticatedRequest.authenticatedUser.role !== "ADMIN"
    ) {
        response.status(403).json({
            success: false,
            message: "Admin access is required"
        });

        return;
    }

    next();
}