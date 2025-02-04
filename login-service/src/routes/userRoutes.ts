import { Router } from "express";
import { UserController } from "../controllers/user.controller";
const router = Router();
router.get("/get-user-by-id/:id", UserController.getOneUser);
router.get("/get-user-from-token/:token", UserController.getOneFromToken);
router.get("/get-user-info-ezV4/:code", UserController.getInfoUserFromCode);

export default router;
