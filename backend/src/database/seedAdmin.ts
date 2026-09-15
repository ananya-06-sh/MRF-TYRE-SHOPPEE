import { hash } from "bcryptjs";
import { database } from "../config/database.js";
import {
    UserRole,
    UserStatus
} from "../generated/prisma/enums.js";

async function seedAdmin(): Promise<void> {
    const displayName =
        process.env.INITIAL_ADMIN_NAME?.trim();

    const loginIdentifier =
        process.env.INITIAL_ADMIN_LOGIN
            ?.trim()
            .toLowerCase();

    const password =
        process.env.INITIAL_ADMIN_PASSWORD;

    if (!displayName || !loginIdentifier || !password) {
        throw new Error(
            "Initial Admin details are missing from .env"
        );
    }

    if (password.length < 10) {
        throw new Error(
            "Initial Admin password must have at least 10 characters"
        );
    }

    const passwordHash = await hash(password, 12);

    const admin = await database.user.upsert({
        where: {
            loginIdentifier
        },
        update: {
            displayName,
            passwordHash,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        },
        create: {
            displayName,
            loginIdentifier,
            passwordHash,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE
        },
        select: {
            id: true,
            displayName: true,
            loginIdentifier: true,
            role: true,
            status: true
        }
    });

    console.log("Admin account ready:", admin);
}

seedAdmin()
    .catch((error: unknown) => {
        console.error("Admin seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await database.$disconnect();
    });