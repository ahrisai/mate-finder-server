import { Router } from "express";

import AuthController from "../controllers/AuthController.js";

const authRouter = Router();

authRouter.post("/registration", AuthController.registration);
authRouter.post("/login", AuthController.login);
authRouter.get("/check", AuthController.check);

export default authRouter;
