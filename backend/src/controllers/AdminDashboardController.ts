import type { Request, Response } from "express";
import { z } from "zod";
import { AdminDashboardService } from "../services/AdminDashboardService.js";

const service = new AdminDashboardService();

const reportQuerySchema = z.object({
    from: z.coerce.date(),
    to: z.coerce.date()
});

function csvCell(value: unknown): string {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export class AdminDashboardController {
    async dashboard(
        _request: Request,
        response: Response
    ): Promise<void> {
        try {
            response.status(200).json({
                success: true,
                dashboard: await service.getDashboard()
            });
        } catch (error: unknown) {
            console.error("Unable to load dashboard:", error);
            response.status(500).json({
                success: false,
                message: "Unable to load dashboard"
            });
        }
    }

    async report(
        request: Request,
        response: Response
    ): Promise<void> {
        const validation = reportQuerySchema.safeParse(request.query);

        if (!validation.success) {
            response.status(400).json({
                success: false,
                message: "Select a valid from and to date"
            });
            return;
        }

        if (validation.data.from > validation.data.to) {
            response.status(400).json({
                success: false,
                message: "From date cannot be after to date"
            });
            return;
        }

        try {
            const orders = await service.getSalesReport(
                validation.data.from,
                validation.data.to
            );

            if (request.query.format === "csv") {
                const header = [
                    "Bill Number",
                    "Date",
                    "Status",
                    "Customer",
                    "Mobile",
                    "Vehicle",
                    "Product Total (INR)",
                    "Service Total (INR)",
                    "Included GST (INR)",
                    "Grand Total (INR)",
                    "Created By"
                ];

                const rows = orders.map((order) => [
                    order.billNumber,
                    order.createdAt.toISOString(),
                    order.status,
                    order.customerName ?? "Walk-in customer",
                    order.customerMobile ?? "",
                    order.vehiclePlateNumber ?? "",
                    (order.productsTotalPaise / 100).toFixed(2),
                    (order.serviceTotalPaise / 100).toFixed(2),
                    (order.includedTaxPaise / 100).toFixed(2),
                    (order.grandTotalPaise / 100).toFixed(2),
                    order.createdBy.displayName
                ]);

                const csv = [header, ...rows]
                    .map((row) => row.map(csvCell).join(","))
                    .join("\r\n");

                response.setHeader("Content-Type", "text/csv; charset=utf-8");
                response.setHeader(
                    "Content-Disposition",
                    `attachment; filename="sales-${validation.data.from.toISOString().slice(0, 10)}-to-${validation.data.to.toISOString().slice(0, 10)}.csv"`
                );
                response.status(200).send(`\uFEFF${csv}`);
                return;
            }

            response.status(200).json({
                success: true,
                orders
            });
        } catch (error: unknown) {
            console.error("Unable to create sales report:", error);
            response.status(500).json({
                success: false,
                message: "Unable to create sales report"
            });
        }
    }
}
