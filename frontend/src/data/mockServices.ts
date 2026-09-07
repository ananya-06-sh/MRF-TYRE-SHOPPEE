import type { ShopService } from "../types/order";

export const mockServices: ShopService[] = [
    {
        serviceId: "SERVICE-ALIGNMENT",
        serviceType: "ALIGNMENT",
        name: "Wheel Alignment",
        description: "Correct the vehicle's wheel alignment.",
        sellingPrice: 800,
        gstRatePercent: 18
    },
    {
        serviceId: "SERVICE-BALANCING",
        serviceType: "BALANCING",
        name: "Wheel Balancing",
        description: "Balance the wheels for a smoother drive.",
        sellingPrice: 600,
        gstRatePercent: 18
    },
    {
        serviceId: "SERVICE-BOTH",
        serviceType: "BOTH",
        name: "Alignment + Balancing",
        description: "Complete alignment and balancing service.",
        sellingPrice: 1300,
        gstRatePercent: 18
    }
];