import Notification from "../models/notification.model";
import { INoti } from "../types/noti.type";
import { Repository } from "./repository";
import { ILogger } from "../types/logs.type";
import Logs from "../models/logs.model";

export class LogsRepository extends Repository<ILogger> {
  constructor() {
    super(Logs);
  }
}
