import { inject, injectable } from "inversify";
import { LoggerService } from "../../services/services/logger.service";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";
import { ILogger } from "../../types/logs.type";
// /src/consumers/userConsumer.ts
@injectable()
class LogsConsumer {
  private loggerService: LoggerService;
  private uow: UnitOfWork;
  constructor(@inject(LoggerService) loggerService: LoggerService, uow: UnitOfWork) {
    this.loggerService = loggerService;
    this.uow = uow;
  }
  async  consume(message: string) {
    // Logic xử lý khi nhận message về tạo logs mới
    try {
      const data = JSON.parse(message);
      const logData = {
        code: data.code,
        logType: data.logType,
        content: data.content,
        ipAddress: data.ipAddress,
      } as ILogger
      const sessionStart = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      await this.loggerService.create(logData, this.uow, sessionStart);
      // Commit giao dịch sau khi hoàn thành
      await this.uow.commit();
      console.log("Log created successfully");
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }
}

export default LogsConsumer;
