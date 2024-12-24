import Notification from "../models/notification.model";
import { INoti } from "../interface/noti.type";
import { Repository } from "./repository";

export class NotiRepository extends Repository<INoti> {
  constructor() {
    super(Notification);
  }
}
