import { injectable } from "inversify";
import { GenericService } from "./generic.service";
import CodeApproval from "../../models/models-project/codeApproval.model";
import { ICodeApproval } from "../../types/codeApproval.type";
@injectable()
export class CodeApprovalService extends GenericService<ICodeApproval> {
  constructor() {
    super(CodeApproval);
  }
}
