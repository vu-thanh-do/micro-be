import Notification from "../models/models-project/notification.model";
import { INoti } from "../types/noti.type";
import { Repository } from "./repository";

export class NotiRepository extends Repository<INoti> {
  constructor() {
    super(Notification);
  }
}
