import express from "express";
const router = express.Router();
import notiRoutes from "./notificationService.routes";
import fileRouter from "./fileService.routes";
const rootRoutes = [notiRoutes,fileRouter];
rootRoutes.map((route) => {
  router.use(route);
});

export default rootRoutes;
