import cors from "cors";
import express from "express";
import { database } from "./config/database.js";
import { environment } from "./config/environment.js";
import catalogueRouter from "./routes/catalogue.routes.js";

export const app = express();

app.use(
    cors({
        origin: environment.FRONTEND_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/api/v1/catalogue", catalogueRouter);

app.get("/api/v1/health", async (_request, response) => {
    try {
        await database.$queryRaw`SELECT 1`;

        response.status(200).json({
            success: true,
            message: "MRF Tyre Shop API is running",
            database: "connected"
        });
    } catch {
        response.status(503).json({
            success: false,
            message: "API is running, but the database is unavailable",
            database: "disconnected"
        });
    }
});