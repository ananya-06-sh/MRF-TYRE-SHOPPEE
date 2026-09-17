import { Router } from "express";
import { OrderHistoryController } from "../controllers/OrderHistoryController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const orderHistoryRouter = Router();

const orderHistoryController =
    new OrderHistoryController();

orderHistoryRouter.use(
    authenticate,
    requireAdmin
);

orderHistoryRouter.get(
    "/",
    orderHistoryController.listOrders.bind(
        orderHistoryController
    )
);

orderHistoryRouter.get(
    "/:orderId",
    orderHistoryController.getOrder.bind(
        orderHistoryController
    )
);

export default orderHistoryRouter;