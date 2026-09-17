import { Router } from "express";
import { AdminInventoryController } from "../controllers/AdminInventoryController.js";
import { AdminInventoryManagementController } from "../controllers/AdminInventoryManagementController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const adminInventoryRouter = Router();

const adminInventoryController =
    new AdminInventoryController();

const inventoryManagementController =
    new AdminInventoryManagementController();

adminInventoryRouter.use(
    authenticate,
    requireAdmin
);

adminInventoryRouter.get(
    "/",
    adminInventoryController.list.bind(
        adminInventoryController
    )
);

adminInventoryRouter.post(
    "/",
    inventoryManagementController.create.bind(
        inventoryManagementController
    )
);

adminInventoryRouter.put(
    "/:inventoryItemId",
    inventoryManagementController.update.bind(
        inventoryManagementController
    )
);

adminInventoryRouter.patch(
    "/:inventoryItemId/active",
    inventoryManagementController
        .changeActiveStatus
        .bind(inventoryManagementController)
);

export default adminInventoryRouter;