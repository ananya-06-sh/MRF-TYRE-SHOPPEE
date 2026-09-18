import type {
    Request,
    Response
} from "express";
import { z } from "zod";
import { TallyXmlService } from "../services/TallyXmlService.js";

const tallyXmlService =
    new TallyXmlService();

const orderIdSchema = z.string().uuid();

export class TallyExportController {
    async downloadOrderXml(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation = orderIdSchema.safeParse(
            request.params.orderId
        );

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message: "Invalid order ID"
            });

            return;
        }

        try {
            const result =
                await tallyXmlService.generateOrderXml(
                    validation.data
                );

            if (!result.success) {
                switch (result.reason) {
                    case "ORDER_NOT_FOUND":
                        response.status(404).json({
                            success: false,
                            message: "Bill was not found"
                        });
                        return;

                    case "ORDER_CANCELLED":
                        response.status(409).json({
                            success: false,
                            message:
                                "A cancelled bill cannot be exported"
                        });
                        return;

                    case "NO_ORDER_LINES":
                        response.status(409).json({
                            success: false,
                            message:
                                "The bill contains no products or services"
                        });
                        return;
                }
            }

            response.setHeader(
                "Content-Type",
                "application/xml; charset=utf-8"
            );

            response.setHeader(
                "Content-Disposition",
                `attachment; filename="${result.fileName}"`
            );

            response.status(200).send(result.xml);
        } catch (error: unknown) {
            console.error(
                "Tally XML export failed:",
                error
            );

            response.status(500).json({
                success: false,
                message:
                    "Unable to generate Tally XML"
            });
        }
    }
}