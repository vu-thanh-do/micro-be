import { Router } from "express";
import { proxyServiceImages } from "../controllers";

const router = Router();

router.get("/images/:filename", proxyServiceImages);

export default router;
