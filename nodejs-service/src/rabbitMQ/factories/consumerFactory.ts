import container from "../../DI";
import { LogsConsumer, notiConsumer, UserConsumer } from "../consumers";
class ConsumerFactory {
  static createConsumer(queueName: string) {
    switch (queueName) {
      case "user_queue":
        return new UserConsumer();
      case "noti_queue":
        return new notiConsumer();
        case "logger_queue":
          return container.get<LogsConsumer>(LogsConsumer)
      default:
        throw new Error("Unknown queue type");
    }
  }
}

export default ConsumerFactory;
