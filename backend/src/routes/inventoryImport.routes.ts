import { Router } from "express";
import multer from "multer";
import { InventoryImportController } from "../controllers/InventoryImportController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const inventoryImportRouter = Router();

const inventoryImportController =
    new InventoryImportController();

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024
    }
});

inventoryImportRouter.use(
    authenticate,
    requireAdmin
);

inventoryImportRouter.post(
    "/csv",
    upload.single("file"),
    inventoryImportController.importCsv.bind(
        inventoryImportController
    )
);

export default inventoryImportRouter;