import { INoti } from "../../types/noti.type";
import Notification from "../../models/notification.model";
import { NotiRepository } from "../../repositories/noti.repository";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";
import { GenericService } from "./generic.service";
import { injectable } from "inversify";
@injectable()
export class NotificationService extends GenericService<INoti> {
  constructor() {
    super(Notification)
  }
}
