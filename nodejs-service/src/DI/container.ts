import { Container } from "inversify";
import { LoggerService } from "../services/services/logger.service";
import { LogsConsumer } from "../rabbitMQ/consumers";
import { NotificationService } from "../services/services/notification.service";
import { UnitOfWork } from "../unitOfWork/unitOfWork";

const container = new Container();
// Bind dependencies
container.bind<LoggerService>(LoggerService).toSelf();
container.bind<LogsConsumer>(LogsConsumer).toSelf();
container.bind<NotificationService>(NotificationService).toSelf();
container.bind<UnitOfWork>(UnitOfWork).toSelf();
export default container;
