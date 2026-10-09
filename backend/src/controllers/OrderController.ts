import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { OrderService } from "../services/OrderService.js";

const orderService = new OrderService();

const productSchema = z.object({
    productId: z
        .string()
        .trim()
        .min(1, "Product ID is required"),

    quantity: z
        .number()
        .int("Quantity must be a whole number")
        .positive(
            "Quantity must be greater than zero"
        )
        .max(1000),

    billedUnitPriceRupees: z
        .number()
        .nonnegative(
            "Billing price cannot be negative"
        )
        .max(10000000)
});

const serviceSchema = z.object({
    serviceId: z
        .string()
        .trim()
        .min(1, "Service ID is required"),

    serviceType: z.enum([
        "ALIGNMENT",
        "BALANCING",
        "BOTH",
        "OTHER"
    ]),

    serviceName: z
        .string()
        .trim()
        .min(1, "Service name is required")
        .max(100),

    quantity: z
        .number()
        .int(
            "Service quantity must be a whole number"
        )
        .positive(
            "Service quantity must be greater than zero"
        )
        .max(100),

    standardUnitPriceRupees: z
        .number()
        .nonnegative(
            "Standard service price cannot be negative"
        )
        .max(10000000),

    billedUnitPriceRupees: z
        .number()
        .nonnegative(
            "Billing service price cannot be negative"
        )
        .max(10000000),

    gstRatePercent: z
        .number()
        .min(0)
        .max(100)
});

const createOrderSchema = z
    .object({
        idempotencyKey: z
            .string()
            .uuid(
                "Invalid billing request ID"
            ),

        customerName: z
            .string()
            .trim()
            .max(100)
            .optional(),

        customerMobile: z
            .string()
            .trim()
            .max(20)
            .optional(),

        vehiclePlateNumber: z
            .string()
            .trim()
            .max(20)
            .optional(),

        vehicleModel: z
            .string()
            .trim()
            .max(100)
            .optional(),

        products: z
            .array(productSchema)
            .max(100)
            .default([]),

        services: z
            .array(serviceSchema)
            .max(100)
            .default([])
    })
    .superRefine((data, context) => {
        if (
            data.products.length === 0 &&
            data.services.length === 0
        ) {
            context.addIssue({
                code: "custom",
                path: ["products"],
                message:
                    "Add at least one tyre or service"
            });
        }

        const productIds =
            data.products.map(
                (product) =>
                    product.productId
                        .trim()
                        .toLowerCase()
            );

        if (
            new Set(productIds).size !==
            productIds.length
        ) {
            context.addIssue({
                code: "custom",
                path: ["products"],
                message:
                    "The same tyre cannot appear twice"
            });
        }

        const serviceIds =
            data.services.map(
                (service) =>
                    service.serviceId
                        .trim()
                        .toLowerCase()
            );

        if (
            new Set(serviceIds).size !==
            serviceIds.length
        ) {
            context.addIssue({
                code: "custom",
                path: ["services"],
                message:
                    "The same service cannot appear twice"
            });
        }
    });

export class OrderController {
    async create(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation =
            createOrderSchema.safeParse(
                request.body
            );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message:
                    validation.error
                        .issues[0]
                        ?.message ??
                    "Invalid billing information"
            });

            return;
        }

        const authenticatedRequest =
            request as AuthenticatedRequest;

        try {
            const result =
                await orderService
                    .createConfirmedOrder(
                        authenticatedRequest
                            .authenticatedUser.id,
                        {
                            idempotencyKey:
                            validation.data
                                .idempotencyKey,

                            customerName:
                            validation.data
                                .customerName,

                            customerMobile:
                            validation.data
                                .customerMobile,

                            vehiclePlateNumber:
                            validation.data
                                .vehiclePlateNumber,

                            vehicleModel:
                            validation.data
                                .vehicleModel,

                            products:
                                validation.data
                                    .products
                                    .map(
                                        (
                                            product
                                        ) => ({
                                            productId:
                                            product
                                                .productId,

                                            quantity:
                                            product
                                                .quantity,

                                            billedUnitPricePaise:
                                                Math.round(
                                                    product
                                                        .billedUnitPriceRupees *
                                                    100
                                                )
                                        })
                                    ),

                            services:
                                validation.data
                                    .services
                                    .map(
                                        (
                                            service
                                        ) => ({
                                            serviceId:
                                            service
                                                .serviceId,

                                            quantity:
                                            service
                                                .quantity,

                                            billedUnitPricePaise:
                                                Math.round(
                                                    service
                                                        .billedUnitPriceRupees *
                                                    100
                                                )
                                        })
                                    )
                        }
                    );

            if (!result.success) {
                if (
                    result.reason ===
                    "INSUFFICIENT_STOCK"
                ) {
                    response.status(409).json({
                        success: false,
                        message:
                            `Not enough stock for ${result.referenceId}`
                    });

                    return;
                }

                if (
                    result.reason ===
                    "PRODUCT_NOT_FOUND"
                ) {
                    response.status(404).json({
                        success: false,
                        message:
                            `Product ${result.referenceId} was not found`
                    });

                    return;
                }

                if (
                    result.reason ===
                    "SERVICE_NOT_FOUND"
                ) {
                    response.status(404).json({
                        success: false,
                        message:
                            `Service ${result.referenceId} was not found or is disabled`
                    });

                    return;
                }

                response.status(400).json({
                    success: false,
                    message:
                        "Vehicle details are required for workshop services"
                });

                return;
            }

            response
                .status(
                    result.order
                        .alreadyConfirmed
                        ? 200
                        : 201
                )
                .json({
                    success: true,
                    message:
                        result.order
                            .alreadyConfirmed
                            ? "Bill was already confirmed"
                            : "Bill confirmed successfully",
                    order: result.order
                });
        } catch (error: unknown) {
            console.error(
                "Unable to confirm bill:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to confirm bill"
            });
        }
    }
}