import cors from "cors";
import express from "express";
import catalogueRouter from "./routes/catalogue.routes.js";

export const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());

app.use("/api/v1/catalogue", catalogueRouter);

app.get("/api/v1/health", (_request, response) => {
    response.status(200).json({
        success: true,
        message: "MRF Tyre Shop API is running"
    });
});