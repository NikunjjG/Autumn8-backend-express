import { Router } from "express";
import { CONTROLLERS } from "../../controllers/index.controllers.js";

const authRouter = Router({mergeParams: true})

authRouter.post('/login', CONTROLLERS.AUTH_CONTROLLERS.LoginController)
authRouter.post('/signup',CONTROLLERS.AUTH_CONTROLLERS.SignUpController)

export default authRouter