import { Repository } from "./repository";
import RequireData from "../models/models-project/requireData.model";
import { IRequireData } from "../types/requireData.type";

export class RequireDataRepository extends Repository<IRequireData> {
  constructor() {
    super(RequireData);
  }
}
