import Notification from "../models/models-project/notification.model";
import { INoti } from "../types/noti.type";
import { Repository } from "./repository";
import Logs from "../models/models-project/logs.model";
import { ILanguage } from "../types/language.type";
import Language from "../models/models-project/language.model";

export class LanguageRepository extends Repository<ILanguage> {
  constructor() {
    super(Language);
  }
}
