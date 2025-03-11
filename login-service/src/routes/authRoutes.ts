import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/login", AuthController.Login);
router.post("/refreshToken", AuthController.refetchToken);

export default router;
