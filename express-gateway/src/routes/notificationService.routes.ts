import { Router } from "express";
import { proxyServiceNotification } from "../controllers/notification.controller";

const router = Router();

router.get("/notification/data", proxyServiceNotification);

export default router;
