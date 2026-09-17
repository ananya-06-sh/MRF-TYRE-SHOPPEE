import { Router } from "express";
import { ServiceJobController } from "../controllers/ServiceJobController.js";
import { authenticate } from "../middleware/authenticate.js";

const serviceJobRouter = Router();

const serviceJobController =
    new ServiceJobController();

serviceJobRouter.use(authenticate);

serviceJobRouter.get(
    "/",
    serviceJobController.list.bind(
        serviceJobController
    )
);

serviceJobRouter.post(
    "/",
    serviceJobController.create.bind(
        serviceJobController
    )
);

serviceJobRouter.patch(
    "/:serviceJobId/technician",
    serviceJobController.assignTechnician.bind(
        serviceJobController
    )
);

serviceJobRouter.patch(
    "/:serviceJobId/status",
    serviceJobController.changeStatus.bind(
        serviceJobController
    )
);

export default serviceJobRouter;