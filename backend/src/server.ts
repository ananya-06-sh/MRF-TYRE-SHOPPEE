import { app } from "./app.js";
import { database } from "./config/database.js";
import { environment } from "./config/environment.js";

const server = app.listen(
    environment.PORT,
    "0.0.0.0",
    () => {
        console.log(
            `MRF Tyre Shop is running on port ${environment.PORT}`
        );
    }
);

async function shutDown(
    signal: string
): Promise<void> {
    console.log(
        `${signal} received. Shutting down safely.`
    );

    server.close(async () => {
        try {
            await database.$disconnect();

            console.log(
                "Database connection closed."
            );

            process.exit(0);
        } catch (error: unknown) {
            console.error(
                "Unable to close the database connection:",
                error
            );

            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error(
            "Forced shutdown after timeout."
        );

        process.exit(1);
    }, 10_000).unref();
}

process.on("SIGTERM", () => {
    void shutDown("SIGTERM");
});

process.on("SIGINT", () => {
    void shutDown("SIGINT");
});