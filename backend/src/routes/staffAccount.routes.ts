import { Router } from "express";
import { StaffAccountController } from "../controllers/StaffAccountController.js";
import { StaffPermissionController } from "../controllers/StaffPermissionController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const staffAccountRouter = Router();

const staffAccountController =
    new StaffAccountController();

const staffPermissionController =
    new StaffPermissionController();

staffAccountRouter.use(
    authenticate,
    requireAdmin
);

staffAccountRouter.get(
    "/",
    staffAccountController.list.bind(
        staffAccountController
    )
);

staffAccountRouter.post(
    "/",
    staffAccountController.create.bind(
        staffAccountController
    )
);

staffAccountRouter.patch(
    "/:staffId/status",
    staffAccountController.changeStatus.bind(
        staffAccountController
    )
);

staffAccountRouter.patch(
    "/:staffId/password",
    staffAccountController.resetPassword.bind(
        staffAccountController
    )
);

staffAccountRouter.patch(
    "/:staffId/stock-in-permission",
    staffPermissionController
        .changeStockInPermission
        .bind(staffPermissionController)
);

export default staffAccountRouter;