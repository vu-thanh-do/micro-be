import { injectable } from "inversify";
import { GenericService } from "./generic.service";
import CodeApproval from "../../models/models-project/codeApproval.model";
import { ICodeApproval } from "../../types/codeApproval.type";
import FormTemplate from "../../models/models-project/formTemplate.model";
import { IFormTemplate } from "../../types/formTemplate.type";
@injectable()
export class FormTemplateService extends GenericService<IFormTemplate> {
  constructor() {
    super(FormTemplate);
  }
}
