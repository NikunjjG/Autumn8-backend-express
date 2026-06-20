import { Router } from "express";
import { fetchCreditsController } from "../../controllers/credits.controller.js";

const creditsRouter = Router({mergeParams: true})

creditsRouter.get('/', fetchCreditsController)

export default creditsRouter