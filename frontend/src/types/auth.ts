export type UserRole = "ADMIN" | "STAFF";

export interface AuthUser {
    id: string;
    displayName: string;
    loginIdentifier: string;
    role: UserRole;
    canStockIn: boolean;
}

export interface LoginCredentials {
    loginIdentifier: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    user: AuthUser;
}