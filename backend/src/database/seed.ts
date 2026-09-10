import { database } from "../config/database.js";
import { TyreCategory } from "../generated/prisma/enums.js";

const products = [
    {
        productId: "MRF-001",
        billingMatchKey: "MRF-ZVTV-16580R14",
        patternAndSize: "MRF ZVTV 165/80 R14",
        normalizedSize: "16580R14",
        category: TyreCategory.PASSENGER_CAR,
        compatibleVehicles: ["Maruti Swift", "WagonR", "Ritz"],
        currentStock: 8,
        lowStockTrigger: 4,
        baseCostPaise: 400000,
        gstRateBasisPoints: 2800,
        finalSellingPricePaise: 560000
    },
    {
        productId: "MRF-002",
        billingMatchKey: "MRF-ZLX-17565R15",
        patternAndSize: "MRF ZLX 175/65 R15",
        normalizedSize: "17565R15",
        category: TyreCategory.PASSENGER_CAR,
        compatibleVehicles: ["Honda City", "Maruti Baleno"],
        currentStock: 3,
        lowStockTrigger: 4,
        baseCostPaise: 460000,
        gstRateBasisPoints: 2800,
        finalSellingPricePaise: 635000
    },
    {
        productId: "MRF-003",
        billingMatchKey: "MRF-ZAPPER-9010010",
        patternAndSize: "MRF Nylogrip Zapper 90/100-10",
        normalizedSize: "9010010",
        category: TyreCategory.TWO_WHEELER,
        compatibleVehicles: ["Honda Activa", "TVS Jupiter"],
        currentStock: 12,
        lowStockTrigger: 4,
        baseCostPaise: 130000,
        gstRateBasisPoints: 2800,
        finalSellingPricePaise: 185000
    },
    {
        productId: "MRF-004",
        billingMatchKey: "MRF-REVZ-14060R17",
        patternAndSize: "MRF Revz 140/60 R17",
        normalizedSize: "14060R17",
        category: TyreCategory.TWO_WHEELER,
        compatibleVehicles: ["Yamaha R15", "MT-15"],
        currentStock: 0,
        lowStockTrigger: 4,
        baseCostPaise: 310000,
        gstRateBasisPoints: 2800,
        finalSellingPricePaise: 425000
    },
    {
        productId: "MRF-005",
        billingMatchKey: "MRF-WANDERER-21575R15",
        patternAndSize: "MRF Wanderer 215/75 R15",
        normalizedSize: "21575R15",
        category: TyreCategory.COMMERCIAL,
        compatibleVehicles: ["Mahindra Bolero", "Pickup"],
        currentStock: 4,
        lowStockTrigger: 4,
        baseCostPaise: 720000,
        gstRateBasisPoints: 2800,
        finalSellingPricePaise: 985000
    }
];

async function seedDatabase() {
    for (const product of products) {
        await database.inventoryItem.upsert({
            where: {
                productId: product.productId
            },
            update: product,
            create: product
        });
    }

    console.log(
        `${products.length} inventory products saved to PostgreSQL`
    );
}

seedDatabase()
    .catch((error: unknown) => {
        console.error("Database seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await database.$disconnect();
    });