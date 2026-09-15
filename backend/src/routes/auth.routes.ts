import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authenticate } from "../middleware/authenticate.js";

const authRouter = Router();
const authController = new AuthController();

authRouter.post(
    "/login",
    authController.login.bind(authController)
);

authRouter.get(
    "/me",
    authenticate,
    authController.currentUser.bind(authController)
);

authRouter.post(
    "/logout",
    authenticate,
    authController.logout.bind(authController)
);

authRouter.patch(
    "/login-identifier",
    authenticate,
    authController.changeLoginIdentifier.bind(authController)
);

authRouter.patch(
    "/password",
    authenticate,
    authController.changePassword.bind(authController)
);

export default authRouter;