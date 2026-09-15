import type {
    NextFunction,
    Request,
    Response
} from "express";
import jwt from "jsonwebtoken";
import { environment } from "../config/environment.js";
import type { UserRole } from "../generated/prisma/enums.js";

export interface AuthenticatedRequest extends Request {
    authenticatedUser: {
        id: string;
        role: UserRole;
    };
}

interface AuthTokenPayload extends jwt.JwtPayload {
    role: UserRole;
}

export function authenticate(
    request: Request,
    response: Response,
    next: NextFunction
): void {
    const token = request.cookies?.mrf_auth_token;

    if (!token || typeof token !== "string") {
        response.status(401).json({
            success: false,
            message: "Please log in"
        });

        return;
    }

    try {
        const payload = jwt.verify(
            token,
            environment.JWT_SECRET
        ) as AuthTokenPayload;

        if (
            !payload.sub ||
            (payload.role !== "ADMIN" &&
                payload.role !== "STAFF")
        ) {
            response.status(401).json({
                success: false,
                message: "Invalid login session"
            });

            return;
        }

        (
            request as AuthenticatedRequest
        ).authenticatedUser = {
            id: payload.sub,
            role: payload.role
        };

        next();
    } catch {
        response.status(401).json({
            success: false,
            message: "Your login session has expired"
        });
    }
}