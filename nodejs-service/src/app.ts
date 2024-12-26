import express from "express";
import connectDb from "./config/db";
import { createExpressServer, useExpressServer } from "routing-controllers";
import NotificationController from "./controllers/noti/notification.controller";
import "reflect-metadata";
import connectRabbitMQ from "./config/rabbitmq";
import LoggerController from "./controllers/logs/logs.controller";

const app = createExpressServer({
  controllers: [NotificationController,LoggerController],
});
app.use(express.json());
connectRabbitMQ()

connectDb();
// useExpressServer(app, );
export default app;
