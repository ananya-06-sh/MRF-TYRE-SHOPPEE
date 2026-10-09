import { database } from "../config/database.js";
import type { ServiceType } from "../generated/prisma/enums.js";

export interface ServiceCatalogueInput {
    serviceId: string;
    serviceType: ServiceType;
    name: string;
    description: string;
    sellingPricePaise: number;
    gstRateBasisPoints: number;
    createsServiceJob: boolean;
}

export class ServiceCatalogueService {
    async listActive() {
        return database.serviceCatalogueItem.findMany({
            where: {
                isActive: true
            },
            orderBy: [
                {
                    name: "asc"
                }
            ]
        });
    }

    async listAll() {
        return database.serviceCatalogueItem.findMany({
            orderBy: [
                {
                    isActive: "desc"
                },
                {
                    name: "asc"
                }
            ]
        });
    }

    async create(input: ServiceCatalogueInput) {
        return database.serviceCatalogueItem.create({
            data: {
                serviceId: input.serviceId
                    .trim()
                    .toUpperCase(),

                serviceType: input.serviceType,

                name: input.name.trim(),

                description: input.description.trim(),

                sellingPricePaise:
                input.sellingPricePaise,

                gstRateBasisPoints:
                input.gstRateBasisPoints,

                createsServiceJob:
                input.createsServiceJob,

                isActive: true
            }
        });
    }

    async update(
        id: string,
        input: ServiceCatalogueInput
    ) {
        const existingService =
            await database.serviceCatalogueItem.findUnique({
                where: {
                    id
                }
            });

        if (!existingService) {
            return null;
        }

        return database.serviceCatalogueItem.update({
            where: {
                id
            },
            data: {
                serviceId: input.serviceId
                    .trim()
                    .toUpperCase(),

                serviceType: input.serviceType,

                name: input.name.trim(),

                description: input.description.trim(),

                sellingPricePaise:
                input.sellingPricePaise,

                gstRateBasisPoints:
                input.gstRateBasisPoints,

                createsServiceJob:
                input.createsServiceJob
            }
        });
    }

    async changeActiveStatus(
        id: string,
        isActive: boolean
    ) {
        const existingService =
            await database.serviceCatalogueItem.findUnique({
                where: {
                    id
                }
            });

        if (!existingService) {
            return null;
        }

        return database.serviceCatalogueItem.update({
            where: {
                id
            },
            data: {
                isActive
            }
        });
    }
}