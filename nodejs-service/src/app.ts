import express from "express";
import connectDb from "./config/dbMongo";
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
import cors from "cors";
import connectRedis from "./config/redisDB";
import HeadCountPlanController from "./controllers/controllers-project/headCountPlan/headCountPlan.controller";
import MasterData from "./models/models-project/masterData.model";
import Language from "./models/models-project/language.model";
import LanguageController from "./controllers/controllers-project/language/language.controller";
import FormTemplate from "./models/models-project/formTemplate.model";
import RequestRecruitmentController from "./controllers/controllers-project/requestRecruitment/requestRecruitment.controller";
import LineMfgController from "./controllers/controllers-project/lineMfg/LineMfg.controller";
import MfgReplaceRecuitmentController from "./controllers/controllers-project/requestRecruitment/mfgReplaceRecuitment.controller";
import { ResignController } from "./controllers/controllers-project/requestRecruitment/resign.controller";
import { SyncCompanyStructureController } from "./controllers/controllers-project/syncCompanyStructure/syncCompanyStrucTure.controller";
import SumaryDepartmentController from "./controllers/controllers-project/sumaryHc/sumaryDepartment.controller";
import { InfoUserController } from "./controllers/controllers-project/infoUser/infoUser.controller";
import RequestMfgNewController from "./controllers/controllers-project/requestRecruitment/requestMfgNew.controller";
import AdoptionController from "./controllers/controllers-project/adoption/adoption.controller";
import { upload } from "./middleware/upload";
import { PendingApprovalController } from "./controllers/controllers-project/pendingApproval/pendingApproval.controller";
import HistoryApprovalController from "./controllers/controllers-project/historyApprove/historyApprove.controller";
useContainer(container);
const app = createExpressServer({
  cors: {
    origin: [
      "http://localhost:3002",
      "http://localhost:3000",
      "http://localhost:3000/",
      "http://localhost:4200",
      "http://localhost:4200/",
      "http://localhost:3002/",
      "http://10.73.131.60:5232",
      "http://10.73.131.60:5232/",
    ],
    credentials: true,
  },
  controllers: [
    NotificationController,
    LoggerController,
    CodeApprovalController,
    RequireDataController,
    FormTemplateController,
    HeadCountPlanController,
    LanguageController,
    RequestRecruitmentController,
    LineMfgController,
    MfgReplaceRecuitmentController,
    ResignController,
    SyncCompanyStructureController,
    SumaryDepartmentController,
    InfoUserController,
    RequestMfgNewController,
    AdoptionController,
    PendingApprovalController,
    HistoryApprovalController
  ],
});
app.post(
  "/adoption/import-adoption-version-hr",
  upload.single("file"),
  (req: any, res: any, next: any) => next()
);

dotenv.config();
app.use(express.json());
connectRabbitMQ();
connectDb();
ConnectSqlServer();
const redis = connectRedis();
export default app;
