import {
    compare,
    hash
} from "bcryptjs";
import jwt from "jsonwebtoken";
import { database } from "../config/database.js";
import { environment } from "../config/environment.js";
import {
    UserStatus,
    type UserRole
} from "../generated/prisma/enums.js";

export interface AuthenticatedUser {
    id: string;
    displayName: string;
    loginIdentifier: string;
    role: UserRole;
    canStockIn: boolean;
}

export interface LoginResult {
    token: string;
    user: AuthenticatedUser;
}

export type CredentialUpdateResult =
    | {
    success: true;
    user: AuthenticatedUser;
}
    | {
    success: false;
    reason:
        | "USER_NOT_FOUND"
        | "INVALID_PASSWORD"
        | "LOGIN_TAKEN";
};

export class AuthService {
    async login(
        loginIdentifier: string,
        password: string
    ): Promise<LoginResult | null> {
        const normalizedLogin =
            loginIdentifier.trim().toLowerCase();

        const user = await database.user.findUnique({
            where: {
                loginIdentifier: normalizedLogin
            }
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
            return null;
        }

        const passwordIsCorrect = await compare(
            password,
            user.passwordHash
        );

        if (!passwordIsCorrect) {
            return null;
        }

        const token = jwt.sign(
            {
                role: user.role
            },
            environment.JWT_SECRET,
            {
                subject: user.id,
                expiresIn: "8h"
            }
        );

        await database.user.update({
            where: {
                id: user.id
            },
            data: {
                lastLoginAt: new Date()
            }
        });

        return {
            token,
            user: this.toAuthenticatedUser(user)
        };
    }

    async getAuthenticatedUser(
        userId: string
    ): Promise<AuthenticatedUser | null> {
        const user = await database.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
            return null;
        }

        return this.toAuthenticatedUser(user);
    }

    async changeLoginIdentifier(
        userId: string,
        newLoginIdentifier: string,
        currentPassword: string
    ): Promise<CredentialUpdateResult> {
        const user = await database.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
            return {
                success: false,
                reason: "USER_NOT_FOUND"
            };
        }

        const passwordIsCorrect = await compare(
            currentPassword,
            user.passwordHash
        );

        if (!passwordIsCorrect) {
            return {
                success: false,
                reason: "INVALID_PASSWORD"
            };
        }

        const normalizedLogin =
            newLoginIdentifier.trim().toLowerCase();

        const existingUser = await database.user.findUnique({
            where: {
                loginIdentifier: normalizedLogin
            }
        });

        if (existingUser && existingUser.id !== userId) {
            return {
                success: false,
                reason: "LOGIN_TAKEN"
            };
        }

        const updatedUser = await database.user.update({
            where: {
                id: userId
            },
            data: {
                loginIdentifier: normalizedLogin
            }
        });

        return {
            success: true,
            user: this.toAuthenticatedUser(updatedUser)
        };
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<CredentialUpdateResult> {
        const user = await database.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user || user.status !== UserStatus.ACTIVE) {
            return {
                success: false,
                reason: "USER_NOT_FOUND"
            };
        }

        const passwordIsCorrect = await compare(
            currentPassword,
            user.passwordHash
        );

        if (!passwordIsCorrect) {
            return {
                success: false,
                reason: "INVALID_PASSWORD"
            };
        }

        const newPasswordHash = await hash(newPassword, 12);

        const updatedUser = await database.user.update({
            where: {
                id: userId
            },
            data: {
                passwordHash: newPasswordHash
            }
        });

        return {
            success: true,
            user: this.toAuthenticatedUser(updatedUser)
        };
    }

    private toAuthenticatedUser(user: {
        id: string;
        displayName: string;
        loginIdentifier: string;
        role: UserRole;
        canStockIn: boolean;
    }): AuthenticatedUser {
        return {
            id: user.id,
            displayName: user.displayName,
            loginIdentifier: user.loginIdentifier,
            role: user.role,
            canStockIn:
                user.role === "ADMIN" ||
                user.canStockIn
        };
    }
}