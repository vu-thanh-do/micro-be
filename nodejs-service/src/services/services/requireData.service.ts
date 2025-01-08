import { INoti } from "../../types/noti.type";
import Notification from "../../models/models-project/notification.model";
import { GenericService } from "./generic.service";
import { injectable } from "inversify";
import { IRequireData } from "../../types/requireData.type";
import RequireData from "../../models/models-project/requireData.model";
@injectable()
export class RequireDataService extends GenericService<IRequireData> {
  constructor() {
    super(RequireData)
  }
}
