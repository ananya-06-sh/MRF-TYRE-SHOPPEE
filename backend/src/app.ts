import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import {
    fileURLToPath
} from "node:url";
import { database } from "./config/database.js";
import { environment } from "./config/environment.js";
import adminInventoryRouter from "./routes/adminInventory.routes.js";
import adminDashboardRouter from "./routes/adminDashboard.routes.js";
import authRouter from "./routes/auth.routes.js";
import catalogueRouter from "./routes/catalogue.routes.js";
import inventoryImportRouter from "./routes/inventoryImport.routes.js";
import orderHistoryRouter from "./routes/orderHistory.routes.js";
import orderRouter from "./routes/order.routes.js";
import serviceCatalogueRouter from "./routes/serviceCatalogue.routes.js";
import serviceJobRouter from "./routes/serviceJob.routes.js";
import staffAccountRouter from "./routes/staffAccount.routes.js";
import stockRouter from "./routes/stock.routes.js";
import tallyExportRouter from "./routes/tallyExport.routes.js";

const currentFilePath =
    fileURLToPath(import.meta.url);

const currentDirectory =
    path.dirname(currentFilePath);

const frontendDistPath =
    path.resolve(
        currentDirectory,
        "../../frontend/dist"
    );

export const app = express();

if (
    environment.NODE_ENV ===
    "production"
) {
    app.set("trust proxy", 1);
}

if (
    environment.NODE_ENV !==
    "production"
) {
    app.use(
        cors({
            origin:
            environment.FRONTEND_URL,
            credentials: true
        })
    );
}

app.disable("x-powered-by");

app.use(
    (
        _request,
        response,
        next
    ) => {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=()"
        );
        next();
    }
);

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(cookieParser());

app.use(
    "/api/v1/auth",
    authRouter
);

app.use(
    "/api/v1/catalogue",
    catalogueRouter
);

app.use(
    "/api/v1/orders",
    orderRouter
);

app.use(
    "/api/v1/service-jobs",
    serviceJobRouter
);

app.use(
    "/api/v1/services",
    serviceCatalogueRouter
);

app.use(
    "/api/v1/admin/inventory",
    adminInventoryRouter
);

app.use(
    "/api/v1/admin/dashboard",
    adminDashboardRouter
);

app.use(
    "/api/v1/admin/staff",
    staffAccountRouter
);

app.use(
    "/api/v1/admin/stock",
    stockRouter
);

app.use(
    "/api/v1/order-history",
    orderHistoryRouter
);

app.use(
    "/api/v1/inventory-import",
    inventoryImportRouter
);

app.use(
    "/api/v1/tally-export",
    tallyExportRouter
);

app.get(
    "/api/v1/health",
    async (
        _request,
        response
    ) => {
        try {
            await database
                .$queryRaw`SELECT 1`;

            response.status(200).json({
                success: true,
                message:
                    "MRF Tyre Shop API is running",
                database:
                    "connected"
            });
        } catch {
            response.status(503).json({
                success: false,
                message:
                    "API is running, but the database is unavailable",
                database:
                    "disconnected"
            });
        }
    }
);

app.use(
    "/api",
    (
        _request,
        response
    ) => {
        response.status(404).json({
            success: false,
            message:
                "API endpoint was not found"
        });
    }
);

if (
    environment.NODE_ENV ===
    "production"
) {
    if (
        !existsSync(
            frontendDistPath
        )
    ) {
        console.warn(
            `Frontend build was not found at ${frontendDistPath}`
        );
    }

    app.use(
        express.static(
            frontendDistPath,
            {
                index: false,
                maxAge: "1d"
            }
        )
    );

    app.use(
        (
            request,
            response,
            next
        ) => {
            if (
                request.method !== "GET"
            ) {
                next();
                return;
            }

            response.sendFile(
                "index.html",
                {
                    root:
                    frontendDistPath
                },
                (error) => {
                    if (error) {
                        next(error);
                    }
                }
            );
        }
    );
}

app.use(
    (
        error: unknown,
        _request: express.Request,
        response: express.Response,
        _next: express.NextFunction
    ) => {
        console.error(
            "Unhandled application error:",
            error
        );

        if (response.headersSent) {
            return;
        }

        response.status(500).json({
            success: false,
            message:
                "An unexpected server error occurred"
        });
    }
);
