import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],

    server: {
        host: "0.0.0.0",
        port: 5173,
        open: true,

        proxy: {
            "/api": {
                target:
                    "http://localhost:3000",
                changeOrigin: true
            }
        }
    },

    preview: {
        host: "0.0.0.0",
        port: 4173
    },

    build: {
        outDir: "dist",
        emptyOutDir: true
    }
});