import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(3000),

    FRONTEND_URL: z
        .string()
        .url()
        .default("http://localhost:5173"),

    DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required"),

    JWT_SECRET: z
        .string()
        .min(64, "JWT_SECRET must contain at least 64 characters")
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
    console.error(
        "Invalid environment configuration:",
        result.error.flatten().fieldErrors
    );

    throw new Error("Invalid environment configuration");
}

export const environment = result.data;