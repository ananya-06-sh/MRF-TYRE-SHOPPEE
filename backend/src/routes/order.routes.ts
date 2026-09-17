import { Router } from "express";
import { OrderController } from "../controllers/OrderController.js";
import { authenticate } from "../middleware/authenticate.js";

const orderRouter = Router();
const orderController = new OrderController();

orderRouter.use(authenticate);

orderRouter.post(
    "/",
    orderController.create.bind(orderController)
);

export default orderRouter;