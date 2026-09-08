import { Router } from "express";
import {
    CatalogueController
} from "../controllers/CatalogueController.js";

const catalogueRouter = Router();
const catalogueController = new CatalogueController();

catalogueRouter.get(
    "/search",
    catalogueController.search.bind(catalogueController)
);

export default catalogueRouter;