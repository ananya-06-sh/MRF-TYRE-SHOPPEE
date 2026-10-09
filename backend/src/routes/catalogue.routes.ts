import { Router } from "express";
import {
    CatalogueController
} from "../controllers/CatalogueController.js";
import { authenticate } from "../middleware/authenticate.js";

const catalogueRouter = Router();
const catalogueController = new CatalogueController();

catalogueRouter.use(authenticate);

catalogueRouter.get(
    "/search",
    catalogueController.search.bind(catalogueController)
);

export default catalogueRouter;
