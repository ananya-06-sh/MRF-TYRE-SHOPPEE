export type TyreCategory =
    | "Two-Wheeler"
    | "Passenger Car"
    | "Commercial";

export type StockStatus =
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK";

export interface StaffTyre {
    productId: string;
    patternAndSize: string;
    category: TyreCategory;
    compatibleVehicles: string[];
    currentStock: number;
    lowStockTrigger: number;
    finalSellingPrice: number;
    gstRatePercent: number;
}

export function getStockStatus(tyre: StaffTyre): StockStatus {
    if (tyre.currentStock === 0) {
        return "OUT_OF_STOCK";
    }

    if (tyre.currentStock <= tyre.lowStockTrigger) {
        return "LOW_STOCK";
    }

    return "IN_STOCK";
}