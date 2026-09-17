export type AdminTyreCategory =
    | "TWO_WHEELER"
    | "PASSENGER_CAR"
    | "COMMERCIAL";

export interface AdminInventoryItem {
    id: string;
    productId: string;
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category: AdminTyreCategory;
    compatibleVehicles: string[];
    currentStock: number;
    lowStockTrigger: number;
    baseCostPaise: number;
    gstRateBasisPoints: number;
    totalCostPaise: number;
    finalSellingPricePaise: number;
    profitPaise: number;
    isActive: boolean;
}

export interface StaffStockInItem {
    id: string;
    productId: string;
    billingMatchKey: string;
    patternAndSize: string;
    category: AdminTyreCategory;
    currentStock: number;
    lowStockTrigger: number;
}

export interface CreateInventoryInput {
    productId: string;
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category: AdminTyreCategory;
    compatibleVehicles: string[];
    openingStock: number;
    lowStockTrigger: number;
    baseCostRupees: number;
    finalSellingPriceRupees: number;
}

export interface UpdateInventoryInput {
    billingMatchKey: string;
    patternAndSize: string;
    normalizedSize: string;
    category: AdminTyreCategory;
    compatibleVehicles: string[];
    lowStockTrigger: number;
    baseCostRupees: number;
    finalSellingPriceRupees: number;
}

export interface StockInInput {
    inventoryItemId: string;
    quantity: number;
    supplierName?: string;
    referenceNumber?: string;
    note?: string;
    occurredAt?: string;
    newBaseCostRupees?: number;
    newSellingPriceRupees?: number;
}