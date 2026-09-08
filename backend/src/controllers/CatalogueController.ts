import type {
    Request,
    Response
} from "express";
import {
    CatalogueService
} from "../services/CatalogueService.js";

const catalogueService = new CatalogueService();

export class CatalogueController {
    search(request: Request, response: Response): void {
        const searchText =
            typeof request.query.q === "string"
                ? request.query.q
                : undefined;

        const products = catalogueService.search(searchText);

        response.status(200).json({
            success: true,
            count: products.length,
            products
        });
    }
}