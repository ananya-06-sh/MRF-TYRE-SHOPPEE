import { database } from "../config/database.js";

export class UserRepository {
    findByLoginIdentifier(loginIdentifier: string) {
        return database.user.findUnique({
            where: {
                loginIdentifier:
                    loginIdentifier.trim().toLowerCase()
            }
        });
    }

    updateLastLogin(userId: string) {
        return database.user.update({
            where: {
                id: userId
            },
            data: {
                lastLoginAt: new Date()
            }
        });
    }
}