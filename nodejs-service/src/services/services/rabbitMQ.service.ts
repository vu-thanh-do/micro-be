import { inject, injectable } from "inversify";
import RequestRecruitment from "../../models/models-project/requestRecruitment.model";
import { CompanySyncService } from "./companySync.service";
import DepartmentRecruitmentRequest from "../../models/models-project/departmentRecruitmentRequest.mode";
import MfgReplaceRecruitmentRequest from "../../models/models-project/mfgReplaceRecruitmentRequest.model";
import { HeadCountRecruitEzV4 } from "../service-Ezv4/headcountDep";
import RecruitmentSummary from "../../models/models-project/recruitmentSummary.model";
@injectable()
class rabbitMqService {
  constructor() {}
}

export default rabbitMqService;
