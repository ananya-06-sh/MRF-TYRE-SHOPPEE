import { hash } from "bcryptjs";
import { database } from "../config/database.js";
import {
    UserRole,
    UserStatus
} from "../generated/prisma/enums.js";

export interface StaffAccount {
    id: string;
    displayName: string;
    loginIdentifier: string;
    status: UserStatus;
    canStockIn: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
}

export type CreateStaffResult =
    | {
    success: true;
    staff: StaffAccount;
}
    | {
    success: false;
    reason: "LOGIN_TAKEN";
};

const staffAccountSelect = {
    id: true,
    displayName: true,
    loginIdentifier: true,
    status: true,
    canStockIn: true,
    lastLoginAt: true,
    createdAt: true
} as const;

export class StaffAccountService {
    async listStaff(): Promise<StaffAccount[]> {
        return database.user.findMany({
            where: {
                role: UserRole.STAFF
            },
            select: staffAccountSelect,
            orderBy: {
                displayName: "asc"
            }
        });
    }

    async createStaff(
        displayName: string,
        loginIdentifier: string,
        password: string
    ): Promise<CreateStaffResult> {
        const normalizedLogin =
            loginIdentifier.trim().toLowerCase();

        const existingUser =
            await database.user.findUnique({
                where: {
                    loginIdentifier: normalizedLogin
                }
            });

        if (existingUser) {
            return {
                success: false,
                reason: "LOGIN_TAKEN"
            };
        }

        const passwordHash = await hash(password, 12);

        const staff = await database.user.create({
            data: {
                displayName: displayName.trim(),
                loginIdentifier: normalizedLogin,
                passwordHash,
                role: UserRole.STAFF,
                status: UserStatus.ACTIVE,
                canStockIn: false
            },
            select: staffAccountSelect
        });

        return {
            success: true,
            staff
        };
    }

    async changeStatus(
        staffId: string,
        status: UserStatus
    ): Promise<StaffAccount | null> {
        const staff = await database.user.findFirst({
            where: {
                id: staffId,
                role: UserRole.STAFF
            }
        });

        if (!staff) {
            return null;
        }

        return database.user.update({
            where: {
                id: staffId
            },
            data: {
                status
            },
            select: staffAccountSelect
        });
    }

    async changeStockInPermission(
        staffId: string,
        canStockIn: boolean
    ): Promise<StaffAccount | null> {
        const staff = await database.user.findFirst({
            where: {
                id: staffId,
                role: UserRole.STAFF
            }
        });

        if (!staff) {
            return null;
        }

        return database.user.update({
            where: {
                id: staffId
            },
            data: {
                canStockIn
            },
            select: staffAccountSelect
        });
    }

    async resetPassword(
        staffId: string,
        newPassword: string
    ): Promise<boolean> {
        const staff = await database.user.findFirst({
            where: {
                id: staffId,
                role: UserRole.STAFF
            }
        });

        if (!staff) {
            return false;
        }

        const passwordHash =
            await hash(newPassword, 12);

        await database.user.update({
            where: {
                id: staffId
            },
            data: {
                passwordHash
            }
        });

        return true;
    }
}