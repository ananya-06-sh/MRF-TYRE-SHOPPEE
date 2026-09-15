import { Router } from "express";
import { AdminInventoryController } from "../controllers/AdminInventoryController.js";
import { StockController } from "../controllers/StockController.js";
import { StockInCatalogueController } from "../controllers/StockInCatalogueController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireStockInAccess } from "../middleware/requireStockInAccess.js";

const stockRouter = Router();

const stockController =
    new StockController();

const adminInventoryController =
    new AdminInventoryController();

const stockInCatalogueController =
    new StockInCatalogueController();

stockRouter.use(authenticate);

stockRouter.get(
    "/inventory",
    requireAdmin,
    adminInventoryController.list.bind(
        adminInventoryController
    )
);

stockRouter.get(
    "/items",
    requireStockInAccess,
    stockInCatalogueController.list.bind(
        stockInCatalogueController
    )
);

stockRouter.post(
    "/stock-in",
    requireStockInAccess,
    stockController.stockIn.bind(stockController)
);

export default stockRouter;