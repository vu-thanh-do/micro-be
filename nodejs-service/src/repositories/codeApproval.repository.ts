import { Repository } from "./repository";
import { ICodeApproval } from "../types/codeApproval.type";
import CodeApproval from "../models/models-project/codeApproval.model";

export class CodeApprovalRepository extends Repository<ICodeApproval> {
  constructor() {
    super(CodeApproval);
  }
}
