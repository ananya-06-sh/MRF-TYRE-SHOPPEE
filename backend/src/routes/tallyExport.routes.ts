import { Router } from "express";
import { TallyExportController } from "../controllers/TallyExportController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const tallyExportRouter = Router();

const tallyExportController =
    new TallyExportController();

tallyExportRouter.use(
    authenticate,
    requireAdmin
);

tallyExportRouter.get(
    "/orders/:orderId/xml",
    tallyExportController.downloadOrderXml.bind(
        tallyExportController
    )
);

export default tallyExportRouter;