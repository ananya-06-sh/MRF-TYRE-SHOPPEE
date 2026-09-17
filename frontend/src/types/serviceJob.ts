export type ServiceJobType =
    | "ALIGNMENT"
    | "BALANCING"
    | "BOTH";

export type ServiceJobStatus =
    | "IN_PROGRESS"
    | "COMPLETED";

export interface ServiceJob {
    id: string;
    jobNumber: string;
    vehiclePlateNumber: string;
    vehicleModel: string;
    serviceType: ServiceJobType;
    assignedTechnician: string | null;
    status: ServiceJobStatus;
    completedAt: string | null;
    createdAt: string;
    order: {
        billNumber: string;
    } | null;
    createdBy: {
        displayName: string;
    };
}

export interface CreateServiceJobInput {
    vehiclePlateNumber: string;
    vehicleModel: string;
    serviceType: ServiceJobType;
    assignedTechnician?: string;
}