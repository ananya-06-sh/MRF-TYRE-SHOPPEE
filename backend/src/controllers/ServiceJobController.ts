import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import {
    ServiceJobStatus
} from "../generated/prisma/enums.js";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { ServiceJobService } from "../services/ServiceJobService.js";

const serviceJobService =
    new ServiceJobService();

const createJobSchema = z.object({
    vehiclePlateNumber: z
        .string()
        .trim()
        .min(3, "Vehicle plate number is required")
        .max(20),

    vehicleModel: z
        .string()
        .trim()
        .min(2, "Vehicle model is required")
        .max(100),

    serviceType: z.enum([
        "ALIGNMENT",
        "BALANCING",
        "BOTH"
    ]),

    assignedTechnician: z
        .string()
        .trim()
        .max(100)
        .optional()
});

const assignTechnicianSchema = z.object({
    assignedTechnician: z
        .string()
        .trim()
        .max(100)
        .nullable()
});

const changeStatusSchema = z.object({
    status: z.enum([
        ServiceJobStatus.IN_PROGRESS,
        ServiceJobStatus.COMPLETED
    ])
});

export class ServiceJobController {
    async list(
        _request: Request,
        response: Response
    ): Promise<void> {
        try {
            const jobs =
                await serviceJobService.listJobs();

            response.status(200).json({
                success: true,
                jobs
            });
        } catch (error: unknown) {
            console.error(
                "Unable to load service jobs:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to load service jobs"
            });
        }
    }

    async create(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            createJobSchema.safeParse(request.body);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error
                        .issues[0]
                        ?.message ??
                    "Invalid service job information"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const job =
                await serviceJobService
                    .createManualJob(
                        authenticatedRequest
                            .authenticatedUser.id,
                        validation.data
                    );

            response.status(201).json({
                success: true,
                message:
                    "Service job created successfully",
                job
            });
        } catch (error: unknown) {
            console.error(
                "Unable to create service job:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to create service job"
            });
        }
    }

    async assignTechnician(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            assignTechnicianSchema.safeParse(
                request.body
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    "Enter a valid technician name"
            });

            return;
        }

        const serviceJobId =
            request.params.serviceJobId;

        if (typeof serviceJobId !== "string") {
            response.status(400).json({
                success: false,
                message: "Invalid service job ID"
            });

            return;
        }

        try {
            const updated =
                await serviceJobService
                    .assignTechnician(
                        serviceJobId,
                        validation.data
                            .assignedTechnician
                    );

            if (!updated) {
                response.status(404).json({
                    success: false,
                    message:
                        "Service job was not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message:
                    "Technician updated successfully"
            });
        } catch (error: unknown) {
            console.error(
                "Unable to assign technician:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to assign technician"
            });
        }
    }

    async changeStatus(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            changeStatusSchema.safeParse(
                request.body
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    "Select a valid service status"
            });

            return;
        }

        const serviceJobId =
            request.params.serviceJobId;

        if (typeof serviceJobId !== "string") {
            response.status(400).json({
                success: false,
                message: "Invalid service job ID"
            });

            return;
        }

        try {
            const updated =
                await serviceJobService
                    .changeStatus(
                        serviceJobId,
                        validation.data.status
                    );

            if (!updated) {
                response.status(404).json({
                    success: false,
                    message:
                        "Service job was not found"
                });

                return;
            }

            response.status(200).json({
                success: true,
                message:
                    "Service status updated successfully"
            });
        } catch (error: unknown) {
            console.error(
                "Unable to update service status:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to update service status"
            });
        }
    }
}