import type { ServiceType } from "./order";

export interface BillingProductInput {
    productId: string;
    quantity: number;
    billedUnitPriceRupees: number;
}

export interface BillingServiceInput {
    serviceId: string;
    serviceType: ServiceType;
    serviceName: string;
    quantity: number;
    standardUnitPriceRupees: number;
    billedUnitPriceRupees: number;
    gstRatePercent: number;
}

export interface ConfirmBillInput {
    idempotencyKey: string;
    customerName?: string;
    customerMobile?: string;
    vehiclePlateNumber?: string;
    vehicleModel?: string;
    products: BillingProductInput[];

    /**
     * New multiple-service format.
     */
    services: BillingServiceInput[];
}

export type OrderStatus =
    | "CONFIRMED"
    | "TALLY_SYNCED"
    | "CANCELLED";

export interface ConfirmedOrder {
    id: string;
    billNumber: string;
    grandTotalPaise: number;
    status: OrderStatus;
    alreadyConfirmed: boolean;
}