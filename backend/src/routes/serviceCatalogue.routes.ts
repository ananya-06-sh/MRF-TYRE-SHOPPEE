import { Router } from "express";
import { ServiceCatalogueController } from "../controllers/ServiceCatalogueController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const serviceCatalogueRouter = Router();

const serviceCatalogueController =
    new ServiceCatalogueController();

serviceCatalogueRouter.use(authenticate);

serviceCatalogueRouter.get(
    "/",
    serviceCatalogueController.listActive.bind(
        serviceCatalogueController
    )
);

serviceCatalogueRouter.get(
    "/admin",
    requireAdmin,
    serviceCatalogueController.listAll.bind(
        serviceCatalogueController
    )
);

serviceCatalogueRouter.post(
    "/admin",
    requireAdmin,
    serviceCatalogueController.create.bind(
        serviceCatalogueController
    )
);

serviceCatalogueRouter.put(
    "/admin/:serviceCatalogueItemId",
    requireAdmin,
    serviceCatalogueController.update.bind(
        serviceCatalogueController
    )
);

serviceCatalogueRouter.patch(
    "/admin/:serviceCatalogueItemId/status",
    requireAdmin,
    serviceCatalogueController.changeStatus.bind(
        serviceCatalogueController
    )
);

export default serviceCatalogueRouter;