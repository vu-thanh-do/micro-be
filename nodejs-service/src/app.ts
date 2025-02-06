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

useContainer(container);
const app = createExpressServer({
  cors: {
    origin: [
      "http://localhost:3002",
      "http://localhost:4200",
      "http://localhost:4200/",
      "http://localhost:3002/",
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
  ],
});
// FormTemplate.create({
//   nameForm: {
//     en: "Job description Template",
//     vi: "Mẫu mô tả công việc",
//     jp: "職務記述書テンプレート",
//   },
//   typeForm: "TPL",
//   version: "1",
//   dateApply: new Date(),
//   fields: [
//     {
//       key: "section_1",
//       type: "title",
//       label: {
//         en: "Job description & requirement ",
//         vi: "Mô tả và yêu cầu công việc",
//         jp: "ランク (就く役職の役職とランクを指定します)",
//       },
//       placeholder: null,
//       required: false,
//     },
//     {
//       key: "position",
//       type: "object",
//       fields: [
//         {
//           key: "position_title",
//           label: {
//             en: "Job description & requirement ",
//             vi: "Position - Cấp bậc (ghi rõ chức danh và grade của vị trí cần tuyển",
//             jp: "ランク (就く役職の役職とランクを指定します)",
//           },
//           placeholder: null,
//           required: false,
//         },
//         {
//           key: "positionName",
//           label: {
//             en: "Position Name",
//             vi: "Chức danh",
//             jp: "ランク",
//           },
//           placeholder: {
//             en: "Position Name",
//             vi: "Chức danh",
//             jp: "ランク",
//           },
//           required: true,
//         },
//         {
//           key: "grade",
//           label: {
//             en: "grade",
//             vi: "Cấp bậc",
//             jp: "ランク",
//           },
//           placeholder: {
//             en: "Cấp bậc",
//             vi: "Cấp bậc",
//             jp: "ランク",
//           },
//           required: true,
//         },
//       ],
//     },
//   ],
//   codeApproval: ['677b9efabd7cd0338bb2e678'],
//   status: "active",
// });
dotenv.config();
app.use(express.json());
connectRabbitMQ();
connectDb();
ConnectSqlServer();
const redis = connectRedis();
export default app;
