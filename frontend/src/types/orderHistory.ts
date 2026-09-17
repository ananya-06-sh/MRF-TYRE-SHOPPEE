export type OrderStatus =
    | "CONFIRMED"
    | "TALLY_SYNCED"
    | "CANCELLED";

export type UserRole =
    | "ADMIN"
    | "STAFF";

export type ServiceType =
    | "ALIGNMENT"
    | "BALANCING"
    | "BOTH";

export type ServiceJobStatus =
    | "IN_PROGRESS"
    | "COMPLETED";

export interface OrderCreator {
    id: string;
    displayName: string;
    loginIdentifier: string;
    role: UserRole;
}

export interface OrderHistorySummary {
    id: string;
    billNumber: string;
    status: OrderStatus;
    customerName: string | null;
    customerMobile: string | null;
    vehiclePlateNumber: string | null;
    vehicleModel: string | null;
    productsTotalPaise: number;
    serviceTotalPaise: number;
    includedTaxPaise: number;
    grandTotalPaise: number;
    tallyVoucherId: string | null;
    tallySyncedAt: string | null;
    createdAt: string;
    createdBy: OrderCreator;
    _count: {
        items: number;
        services: number;
    };
}

export interface OrderHistoryItem {
    id: string;
    productIdSnapshot: string;
    billingMatchKeySnapshot: string;
    productNameSnapshot: string;
    quantity: number;
    standardUnitPricePaise: number;
    billedUnitPricePaise: number;
    gstRateBasisPoints: number;
    includedTaxPaise: number;
    lineTotalPaise: number;
    createdAt: string;
}

export interface OrderHistoryServiceLine {
    id: string;
    serviceIdSnapshot: string;
    serviceNameSnapshot: string;
    quantity: number;
    standardUnitPricePaise: number;
    billedUnitPricePaise: number;
    gstRateBasisPoints: number;
    includedTaxPaise: number;
    lineTotalPaise: number;
    createdAt: string;
}

export interface OrderHistoryServiceJob {
    id: string;
    jobNumber: string;
    serviceType: ServiceType;
    assignedTechnician: string | null;
    status: ServiceJobStatus;
    completedAt: string | null;
}

export interface OrderHistoryDetail {
    id: string;
    billNumber: string;
    status: OrderStatus;
    customerName: string | null;
    customerMobile: string | null;
    vehiclePlateNumber: string | null;
    vehicleModel: string | null;
    productsTotalPaise: number;
    serviceTotalPaise: number;
    includedTaxPaise: number;
    grandTotalPaise: number;
    tallyVoucherId: string | null;
    tallySyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: OrderCreator;
    items: OrderHistoryItem[];
    services: OrderHistoryServiceLine[];
    serviceJob: OrderHistoryServiceJob | null;
}