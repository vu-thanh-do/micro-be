import express from "express";
import connectDb from "./config/db";
import { createExpressServer, useExpressServer } from "routing-controllers";
import NotificationController from "./controllers/notification.controller";
import "reflect-metadata";

const app = createExpressServer({
  controllers: [NotificationController],
});
app.use(express.json());
connectDb();
// useExpressServer(app, );
export default app;
