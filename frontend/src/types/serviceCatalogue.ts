export type ServiceType =
    | "ALIGNMENT"
    | "BALANCING"
    | "BOTH"
    | "OTHER";

export interface ServiceCatalogueItem {
    id: string;
    serviceId: string;
    serviceType: ServiceType;
    name: string;
    description: string;
    sellingPrice: number;
    gstRatePercent: number;
    createsServiceJob: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceCatalogueInput {
    serviceId: string;
    serviceType: ServiceType;
    name: string;
    description: string;
    sellingPriceRupees: number;
    gstRatePercent: number;
    createsServiceJob: boolean;
}