export type TyreCategory =
    | "Two-Wheeler"
    | "Passenger Car"
    | "Commercial";

export interface StaffProductDto {
    productId: string;
    patternAndSize: string;
    category: TyreCategory;
    compatibleVehicles: string[];
    currentStock: number;
    lowStockTrigger: number;
    finalSellingPrice: number;
    gstRatePercent: number;
}