import { database } from "../config/database.js";
import type {
    StaffProductDto,
    TyreCategory as StaffTyreCategory
} from "../dtos/StaffProductDto.js";
import {
    TyreCategory
} from "../generated/prisma/enums.js";

const categoryLabels: Record<
    TyreCategory,
    StaffTyreCategory
> = {
    TWO_WHEELER: "Two-Wheeler",
    PASSENGER_CAR: "Passenger Car",
    COMMERCIAL: "Commercial"
};

export class InventoryRepository {
    async findAllForStaff(): Promise<StaffProductDto[]> {
        const products = await database.inventoryItem.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                patternAndSize: "asc"
            },
            select: {
                productId: true,
                patternAndSize: true,
                category: true,
                compatibleVehicles: true,
                currentStock: true,
                lowStockTrigger: true,
                finalSellingPricePaise: true,
                gstRateBasisPoints: true
            }
        });

        return products.map((product) => ({
            productId: product.productId,
            patternAndSize: product.patternAndSize,
            category: categoryLabels[product.category],
            compatibleVehicles: product.compatibleVehicles,
            currentStock: product.currentStock,
            lowStockTrigger: product.lowStockTrigger,
            finalSellingPrice:
                product.finalSellingPricePaise / 100,
            gstRatePercent:
                product.gstRateBasisPoints / 100
        }));
    }
}