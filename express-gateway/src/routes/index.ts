import express from "express";
const router = express.Router();
import notiRoutes from "./notificationService.routes";
const rootRoutes = [notiRoutes];
rootRoutes.map((route) => {
  router.use(route);
});

export default rootRoutes;
