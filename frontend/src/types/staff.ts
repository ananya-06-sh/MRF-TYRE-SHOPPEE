export type StaffStatus =
    | "ACTIVE"
    | "DISABLED";

export interface StaffAccount {
    id: string;
    displayName: string;
    loginIdentifier: string;
    status: StaffStatus;
    canStockIn: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface CreateStaffInput {
    displayName: string;
    loginIdentifier: string;
    password: string;
}