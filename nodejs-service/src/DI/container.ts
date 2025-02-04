import { Container } from "inversify";
import { LoggerService } from "../services/services/logger.service";
import { LogsConsumer } from "../rabbitMQ/consumers";
import { NotificationService } from "../services/services/notification.service";
import { UnitOfWork } from "../unitOfWork/unitOfWork";
import { CodeApprovalService } from "../services/services/codeApproval.service";
import CodeApprovalController from "../controllers/controllers-project/codeApproval/codeApproval.controller";
import { RequireDataService } from "../services/services/requireData.service";
import RequireDataController from "../controllers/controllers-project/requireData/requireData.controller";
import { FormTemplateService } from "../services/services/formTemplate.service";
import FormTemplateController from "../controllers/controllers-project/formTemplate/formTemplate.controller";
import NotificationController from "../controllers/controllers-project/noti/notification.controller";
import LoggerController from "../controllers/controllers-project/logs/logs.controller";
import { ResponseDataService } from "../services/services/response.service";
import { HeadCountRecruitEzV4 } from "../services/service-Ezv4/headcountDep";
import HeadCountPlanController from "../controllers/controllers-project/headCountPlan/headCountPlan.controller";

const container = new Container();
// Bind dependencies
container.bind<LoggerService>(LoggerService).toSelf();
container.bind<CodeApprovalService>(CodeApprovalService).toSelf();
container.bind<RequireDataService>(RequireDataService).toSelf();
container.bind<FormTemplateService>(FormTemplateService).toSelf();
container.bind<LogsConsumer>(LogsConsumer).toSelf();
container.bind<NotificationService>(NotificationService).toSelf();
container.bind<UnitOfWork>(UnitOfWork).toSelf();
container.bind<ResponseDataService>(ResponseDataService).toSelf();
container.bind<HeadCountRecruitEzV4>(HeadCountRecruitEzV4).toSelf();


// bind controlelr
container.bind<CodeApprovalController>(CodeApprovalController).toSelf();
container.bind<RequireDataController>(RequireDataController).toSelf();
container.bind<FormTemplateController>(FormTemplateController).toSelf();
container.bind<NotificationController>(NotificationController).toSelf();
container.bind<LoggerController>(LoggerController).toSelf();
container.bind<HeadCountPlanController>(HeadCountPlanController).toSelf();

export default container;
