import type {
    NextFunction,
    Request,
    Response
} from "express";
import { database } from "../config/database.js";
import { UserStatus } from "../generated/prisma/enums.js";
import type { AuthenticatedRequest } from "./authenticate.js";

export async function requireStockInAccess(
    request: Request,
    response: Response,
    next: NextFunction
): Promise<void> {
    const authenticatedRequest =
        request as AuthenticatedRequest;

    const authenticatedUser =
        authenticatedRequest.authenticatedUser;

    if (!authenticatedUser) {
        response.status(401).json({
            success: false,
            message: "Please log in"
        });

        return;
    }

    if (authenticatedUser.role === "ADMIN") {
        next();
        return;
    }

    try {
        const user = await database.user.findUnique({
            where: {
                id: authenticatedUser.id
            },
            select: {
                status: true,
                canStockIn: true
            }
        });

        if (
            !user ||
            user.status !== UserStatus.ACTIVE ||
            !user.canStockIn
        ) {
            response.status(403).json({
                success: false,
                message:
                    "You do not have permission to perform Stock-In"
            });

            return;
        }

        next();
    } catch (error: unknown) {
        console.error(
            "Unable to check Stock-In permission:",
            error
        );

        response.status(500).json({
            success: false,
            message: "Unable to verify permission"
        });
    }
}