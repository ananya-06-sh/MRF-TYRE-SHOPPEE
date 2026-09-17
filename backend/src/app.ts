import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { database } from "./config/database.js";
import { environment } from "./config/environment.js";
import adminInventoryRouter from "./routes/adminInventory.routes.js";
import authRouter from "./routes/auth.routes.js";
import catalogueRouter from "./routes/catalogue.routes.js";
import orderRouter from "./routes/order.routes.js";
import serviceJobRouter from "./routes/serviceJob.routes.js";
import staffAccountRouter from "./routes/staffAccount.routes.js";
import stockRouter from "./routes/stock.routes.js";
import orderHistoryRouter from "./routes/orderHistory.routes.js";
import inventoryImportRouter from "./routes/inventoryImport.routes.js";

export const app = express();

app.use(
    cors({
        origin: environment.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/catalogue", catalogueRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/service-jobs", serviceJobRouter);

app.use(
    "/api/v1/admin/inventory",
    adminInventoryRouter
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
app.get(
    "/api/v1/health",
    async (_request, response) => {
        try {
            await database.$queryRaw`SELECT 1`;

            response.status(200).json({
                success: true,
                message:
                    "MRF Tyre Shop API is running",
                database: "connected"
            });
        } catch {
            response.status(503).json({
                success: false,
                message:
                    "API is running, but the database is unavailable",
                database: "disconnected"
            });
        }
    }
);