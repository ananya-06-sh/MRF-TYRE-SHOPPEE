import type {
    Request,
    Response
} from "express";
import {
    CatalogueService
} from "../services/CatalogueService.js";

const catalogueService = new CatalogueService();

export class CatalogueController {
    async search(
        request: Request,
        response: Response
    ): Promise<void> {
        try {
            const searchText =
                typeof request.query.q === "string"
                    ? request.query.q
                    : undefined;

            const products =
                await catalogueService.search(searchText);

            response.status(200).json({
                success: true,
                count: products.length,
                products
            });
        } catch (error) {
            console.error(
                "Catalogue search failed:",
                error
            );

            response.status(500).json({
                success: false,
                message: "Unable to load inventory"
            });
        }
    }
}