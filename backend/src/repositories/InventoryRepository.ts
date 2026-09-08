import type {
    StaffProductDto
} from "../dtos/StaffProductDto.js";

const products: StaffProductDto[] = [
    {
        productId: "MRF-001",
        patternAndSize: "MRF ZVTV 165/80 R14",
        category: "Passenger Car",
        compatibleVehicles: ["Maruti Swift", "WagonR", "Ritz"],
        currentStock: 8,
        lowStockTrigger: 4,
        finalSellingPrice: 5600,
        gstRatePercent: 28
    },
    {
        productId: "MRF-002",
        patternAndSize: "MRF ZLX 175/65 R15",
        category: "Passenger Car",
        compatibleVehicles: ["Honda City", "Maruti Baleno"],
        currentStock: 3,
        lowStockTrigger: 4,
        finalSellingPrice: 6350,
        gstRatePercent: 28
    },
    {
        productId: "MRF-003",
        patternAndSize: "MRF Nylogrip Zapper 90/100-10",
        category: "Two-Wheeler",
        compatibleVehicles: ["Honda Activa", "TVS Jupiter"],
        currentStock: 12,
        lowStockTrigger: 4,
        finalSellingPrice: 1850,
        gstRatePercent: 28
    },
    {
        productId: "MRF-004",
        patternAndSize: "MRF Revz 140/60 R17",
        category: "Two-Wheeler",
        compatibleVehicles: ["Yamaha R15", "MT-15"],
        currentStock: 0,
        lowStockTrigger: 4,
        finalSellingPrice: 4250,
        gstRatePercent: 28
    },
    {
        productId: "MRF-005",
        patternAndSize: "MRF Wanderer 215/75 R15",
        category: "Commercial",
        compatibleVehicles: ["Mahindra Bolero", "Pickup"],
        currentStock: 4,
        lowStockTrigger: 4,
        finalSellingPrice: 9850,
        gstRatePercent: 28
    }
];

export class InventoryRepository {
    findAllForStaff(): StaffProductDto[] {
        return products;
    }
}