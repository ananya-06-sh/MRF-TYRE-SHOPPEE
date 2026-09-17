export interface BillingProductInput {
    productId: string;
    quantity: number;
    billedUnitPriceRupees: number;
}

export interface BillingServiceInput {
    serviceId: string;
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
    service?: BillingServiceInput;
}

export interface ConfirmedOrder {
    id: string;
    billNumber: string;
    grandTotalPaise: number;
    status:
        | "CONFIRMED"
        | "TALLY_SYNCED"
        | "CANCELLED";
    alreadyConfirmed: boolean;
}