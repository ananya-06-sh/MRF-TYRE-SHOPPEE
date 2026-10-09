import type {
    NextFunction,
    Request,
    Response
} from "express";
import jwt from "jsonwebtoken";
import { database } from "../config/database.js";
import { environment } from "../config/environment.js";
import {
    UserStatus,
    type UserRole
} from "../generated/prisma/enums.js";

export interface AuthenticatedRequest extends Request {
    authenticatedUser: {
        id: string;
        role: UserRole;
    };
}

interface AuthTokenPayload extends jwt.JwtPayload {
    role: UserRole;
}

export async function authenticate(
    request: Request,
    response: Response,
    next: NextFunction
): Promise<void> {
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

        const user =
            await database.user.findUnique({
                where: {
                    id: payload.sub
                },
                select: {
                    id: true,
                    role: true,
                    status: true
                }
            });

        if (
            !user ||
            user.status !==
            UserStatus.ACTIVE
        ) {
            response.clearCookie(
                "mrf_auth_token",
                {
                    httpOnly: true,
                    secure:
                    environment.NODE_ENV ===
                    "production",
                    sameSite: "lax"
                }
            );

            response.status(401).json({
                success: false,
                message:
                    "Your account is disabled or unavailable"
            });

            return;
        }

        (
            request as AuthenticatedRequest
        ).authenticatedUser = {
            id: user.id,
            role: user.role
        };

        next();
    } catch (error: unknown) {
        if (
            error instanceof
            jwt.JsonWebTokenError
        ) {
            response.status(401).json({
                success: false,
                message:
                    "Your login session has expired"
            });

            return;
        }

        console.error(
            "Unable to authenticate request:",
            error
        );

        response.status(500).json({
            success: false,
            message:
                "Unable to verify your login session"
        });
    }
}
