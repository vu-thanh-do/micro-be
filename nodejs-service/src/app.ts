import express from "express";
import connectDb from "./config/db";
import {
  createExpressServer,
  useContainer,
  useExpressServer,
} from "routing-controllers";
import "reflect-metadata";
import LoggerController from "./controllers/controllers-project/logs/logs.controller";
import connectRabbitMQ from "./config/RabbitMQ";
import CodeApprovalController from "./controllers/controllers-project/codeApproval/codeApproval.controller";
import container from "./DI";
import RequireDataController from "./controllers/controllers-project/requireData/requireData.controller";
import dotenv from "dotenv";
import { ConnectSqlServer } from "./config/ezV4Db";
import NotificationController from "./controllers/controllers-project/noti/notification.controller";
import FormTemplateController from "./controllers/controllers-project/formTemplate/formTemplate.controller";

useContainer(container);
const app = createExpressServer({
  controllers: [
    NotificationController,
    LoggerController,
    CodeApprovalController,
    RequireDataController,
    FormTemplateController,
  ],
});
app.use(express.json());
dotenv.config();
connectRabbitMQ();
connectDb();
ConnectSqlServer();
export default app;
