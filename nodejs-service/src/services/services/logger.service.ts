import { ILogger } from "../../types/logs.type";
import Logs from "../../models/models-project/logs.model";
import { LogsRepository } from "../../repositories/logs.repository";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";
import { injectable } from "inversify";
import { GenericService } from "./generic.service";
@injectable()
export class LoggerService extends GenericService<ILogger> {
  constructor() {
    super(Logs);
  }
}
