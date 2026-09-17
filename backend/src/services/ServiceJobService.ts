import { randomUUID } from "node:crypto";
import { database } from "../config/database.js";
import {
    ServiceJobStatus,
    type ServiceType
} from "../generated/prisma/enums.js";

export interface CreateServiceJobInput {
    vehiclePlateNumber: string;
    vehicleModel: string;
    serviceType: ServiceType;
    assignedTechnician?: string;
}

export class ServiceJobService {
    async listJobs() {
        return database.serviceJob.findMany({
            select: {
                id: true,
                jobNumber: true,
                vehiclePlateNumber: true,
                vehicleModel: true,
                serviceType: true,
                assignedTechnician: true,
                status: true,
                completedAt: true,
                createdAt: true,
                order: {
                    select: {
                        billNumber: true
                    }
                },
                createdBy: {
                    select: {
                        displayName: true
                    }
                }
            },
            orderBy: [
                {
                    status: "desc"
                },
                {
                    createdAt: "desc"
                }
            ]
        });
    }

    async createManualJob(
        createdById: string,
        input: CreateServiceJobInput
    ) {
        const jobNumber =
            `JOB-${Date.now()}-${randomUUID()
                .slice(0, 6)
                .toUpperCase()}`;

        return database.serviceJob.create({
            data: {
                jobNumber,
                createdById,
                vehiclePlateNumber:
                    input.vehiclePlateNumber
                        .trim()
                        .toUpperCase(),
                vehicleModel:
                    input.vehicleModel.trim(),
                serviceType:
                input.serviceType,
                assignedTechnician:
                    input.assignedTechnician
                        ?.trim() || null
            }
        });
    }

    async assignTechnician(
        serviceJobId: string,
        technicianName: string | null
    ): Promise<boolean> {
        const existingJob =
            await database.serviceJob.findUnique({
                where: {
                    id: serviceJobId
                }
            });

        if (!existingJob) {
            return false;
        }

        await database.serviceJob.update({
            where: {
                id: serviceJobId
            },
            data: {
                assignedTechnician:
                    technicianName?.trim() || null
            }
        });

        return true;
    }

    async changeStatus(
        serviceJobId: string,
        status: ServiceJobStatus
    ): Promise<boolean> {
        const existingJob =
            await database.serviceJob.findUnique({
                where: {
                    id: serviceJobId
                }
            });

        if (!existingJob) {
            return false;
        }

        await database.serviceJob.update({
            where: {
                id: serviceJobId
            },
            data: {
                status,
                completedAt:
                    status ===
                    ServiceJobStatus.COMPLETED
                        ? new Date()
                        : null
            }
        });

        return true;
    }
}