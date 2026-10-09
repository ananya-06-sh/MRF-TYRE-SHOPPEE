import type {
    Request,
    Response
} from "express";
import { Prisma } from "../generated/prisma/client.js";
import { z } from "zod";
import { ServiceCatalogueService } from "../services/ServiceCatalogueService.js";

const serviceCatalogueService =
    new ServiceCatalogueService();

const serviceIdParameterSchema = z.object({
    serviceCatalogueItemId: z
        .string()
        .uuid("Invalid service ID")
});

const serviceInputSchema = z.object({
    serviceId: z
        .string()
        .trim()
        .min(1, "Service code is required")
        .max(50, "Service code is too long"),

    serviceType: z.enum([
        "ALIGNMENT",
        "BALANCING",
        "BOTH",
        "OTHER"
    ]),

    name: z
        .string()
        .trim()
        .min(1, "Service name is required")
        .max(100, "Service name is too long"),

    description: z
        .string()
        .trim()
        .max(500, "Description is too long")
        .default(""),

    sellingPriceRupees: z
        .number()
        .nonnegative(
            "Selling price cannot be negative"
        )
        .max(
            10000000,
            "Selling price is too large"
        ),

    gstRatePercent: z
        .number()
        .min(0, "GST cannot be negative")
        .max(100, "GST cannot exceed 100%"),

    createsServiceJob: z
        .boolean()
        .default(true)
});

const statusSchema = z.object({
    isActive: z.boolean()
});

function serializeService(service: {
    id: string;
    serviceId: string;
    serviceType:
        | "ALIGNMENT"
        | "BALANCING"
        | "BOTH"
        | "OTHER";
    name: string;
    description: string;
    sellingPricePaise: number;
    gstRateBasisPoints: number;
    createsServiceJob: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}) {
    return {
        id: service.id,
        serviceId: service.serviceId,
        serviceType: service.serviceType,
        name: service.name,
        description: service.description,

        sellingPrice:
            service.sellingPricePaise / 100,

        gstRatePercent:
            service.gstRateBasisPoints / 100,

        createsServiceJob:
        service.createsServiceJob,

        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
    };
}

function isUniqueConstraintError(
    error: unknown
): boolean {
    return (
        error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    );
}

export class ServiceCatalogueController {
    async listActive(
        _request: Request,
        response: Response
    ): Promise<void> {
        try {
            const services =
                await serviceCatalogueService.listActive();

            response.status(200).json({
                success: true,
                services: services.map(
                    serializeService
                )
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load services:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to load services"
            });
        }
    }

    async listAll(
        _request: Request,
        response: Response
    ): Promise<void> {
        try {
            const services =
                await serviceCatalogueService.listAll();

            response.status(200).json({
                success: true,
                services: services.map(
                    serializeService
                )
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load service catalogue:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to load service catalogue"
            });
        }
    }

    async create(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            serviceInputSchema.safeParse(
                request.body
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]
                        ?.message ??
                    "Invalid service information"
            });

            return;
        }

        try {
            const service =
                await serviceCatalogueService.create({
                    serviceId:
                    validation.data.serviceId,

                    serviceType:
                    validation.data.serviceType,

                    name:
                    validation.data.name,

                    description:
                    validation.data.description,

                    sellingPricePaise:
                        Math.round(
                            validation.data
                                .sellingPriceRupees *
                            100
                        ),

                    gstRateBasisPoints:
                        Math.round(
                            validation.data
                                .gstRatePercent *
                            100
                        ),

                    createsServiceJob:
                    validation.data
                        .createsServiceJob
                });

            response.status(201).json({
                success: true,
                message:
                    "Service created successfully",
                service: serializeService(service)
            });
        } catch (error: unknown) {
            if (isUniqueConstraintError(error)) {
                response.status(409).json({
                    success: false,
                    message:
                        "This service code is already in use"
                });

                return;
            }

            console.error(
                "Unable to create service:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to create service"
            });
        }
    }

    async update(
        request: Request,
        response: Response
    ): Promise<void> {
        const parameterValidation =
            serviceIdParameterSchema.safeParse(
                request.params
            );

        if (!parameterValidation.success) {
            response.status(400).json({
                success: false,
                message:
                    parameterValidation.error
                        .issues[0]?.message ??
                    "Invalid service ID"
            });

            return;
        }

        const validation =
            serviceInputSchema.safeParse(
                request.body
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]
                        ?.message ??
                    "Invalid service information"
            });

            return;
        }

        try {
            const service =
                await serviceCatalogueService.update(
                    parameterValidation.data
                        .serviceCatalogueItemId,
                    {
                        serviceId:
                        validation.data
                            .serviceId,

                        serviceType:
                        validation.data
                            .serviceType,

                        name:
                        validation.data.name,

                        description:
                        validation.data
                            .description,

                        sellingPricePaise:
                            Math.round(
                                validation.data
                                    .sellingPriceRupees *
                                100
                            ),

                        gstRateBasisPoints:
                            Math.round(
                                validation.data
                                    .gstRatePercent *
                                100
                            ),

                        createsServiceJob:
                        validation.data
                            .createsServiceJob
                    }
                );

            if (!service) {
                response.status(404).json({
                    success: false,
                    message: "Service was not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message:
                    "Service updated successfully",
                service: serializeService(service)
            });
        } catch (error: unknown) {
            if (isUniqueConstraintError(error)) {
                response.status(409).json({
                    success: false,
                    message:
                        "This service code is already in use"
                });

                return;
            }

            console.error(
                "Unable to update service:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to update service"
            });
        }
    }

    async changeStatus(
        request: Request,
        response: Response
    ): Promise<void> {
        const parameterValidation =
            serviceIdParameterSchema.safeParse(
                request.params
            );

        if (!parameterValidation.success) {
            response.status(400).json({
                success: false,
                message:
                    parameterValidation.error
                        .issues[0]?.message ??
                    "Invalid service ID"
            });

            return;
        }

        const validation =
            statusSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error.issues[0]
                        ?.message ??
                    "Invalid service status"
            });

            return;
        }

        try {
            const service =
                await serviceCatalogueService
                    .changeActiveStatus(
                        parameterValidation.data
                            .serviceCatalogueItemId,
                        validation.data.isActive
                    );

            if (!service) {
                response.status(404).json({
                    success: false,
                    message: "Service was not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message: service.isActive
                    ? "Service enabled successfully"
                    : "Service disabled successfully",
                service: serializeService(service)
            });
        } catch (error: unknown) {
            console.error(
                "Unable to change service status:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to change service status"
            });
        }
    }
}