import FormTemplate from "../models/models-project/formTemplate.model";
import { IFormTemplate } from "../types/formTemplate.type";
import { Repository } from "./repository";

export class FormTemplateRepository extends Repository<IFormTemplate>{
    constructor() {
        super(FormTemplate);
      }
}