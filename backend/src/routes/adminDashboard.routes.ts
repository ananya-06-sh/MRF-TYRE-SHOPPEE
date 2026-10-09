import { Router } from "express";
import { AdminDashboardController } from "../controllers/AdminDashboardController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
const controller = new AdminDashboardController();

router.use(authenticate, requireAdmin);
router.get("/", controller.dashboard.bind(controller));
router.get("/sales-report", controller.report.bind(controller));

export default router;
