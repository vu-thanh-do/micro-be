import { inject, injectable } from "inversify";
import RequestRecruitment from "../../models/models-project/requestRecruitment.model";
import { CompanySyncService } from "./companySync.service";
import DepartmentRecruitmentRequest from "../../models/models-project/departmentRecruitmentRequest.mode";
import MfgReplaceRecruitmentRequest from "../../models/models-project/mfgReplaceRecruitmentRequest.model";
import { HeadCountRecruitEzV4 } from "../service-Ezv4/headcountDep";
import RecruitmentSummary from "../../models/models-project/recruitmentSummary.model";
@injectable()
class SumaryDepService {
  private companySyncService: CompanySyncService;
  private headCountRecruitEzV4: HeadCountRecruitEzV4;
  constructor(@inject(CompanySyncService) companySyncService: CompanySyncService, @inject(HeadCountRecruitEzV4) headCountRecruitEzV4: HeadCountRecruitEzV4) {
    this.companySyncService = companySyncService;
    this.headCountRecruitEzV4 = headCountRecruitEzV4;
  }

  async getSumaryDepartment(
    year: number,
    month: number,
    divCode?: string,
    deptCode?: string,
    page = 1,
    limit = 10
  ) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    const query: any = {
      createdAt: { $gte: start, $lt: end },
    };
  
    if (deptCode && deptCode !== 'null' && deptCode !== 'undefined' && deptCode.trim() !== '') {
      query.deptCode = deptCode;
    } else {
      const checkCompanyStructure = await this.companySyncService.findDepartmentChild(divCode!);
      if (!checkCompanyStructure || !checkCompanyStructure.children?.length) {
        return {
          message: "Không tìm thấy phòng ban",
          status: 404,
        };
      }
      const listId = checkCompanyStructure.children.map((item: any) => String(item._id).trim());
      query.deptCode = { $in: listId };
    }
  
    // Lấy danh sách yêu cầu
    const result = await RequestRecruitment.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
    });
  
    const docsWithDetails = await Promise.all(
      result.docs.map(async (item: any) => {
        const [departmentData, mfgReplacementData] = await Promise.all([
          DepartmentRecruitmentRequest.findOne({ requestId: item._id }),
          MfgReplaceRecruitmentRequest.findOne({ requestId: item._id }),
        ]);
  
        return {
          ...item.toObject(),
          departmentDetail: departmentData || null,
          mfgReplacementDetail: mfgReplacementData || null,
        };
      })
    );
  
    return {
      ...result,
      docs: docsWithDetails,
    };
  }
  async infoHeadcountDepartment(year: string,  divCode: string, deptCode: string) {
    const dataHeadcount = await this.headCountRecruitEzV4.getHeadCountByDept(divCode, year, deptCode);
    return dataHeadcount;
  }
  async addAdjust(year: string, month: string, note: string, deptCode: string, adjust: number) {
    const dataAdjust = await RecruitmentSummary.create({
      year,
      month,
      note,
      departmentId: deptCode,
      adjust,
    });
    return dataAdjust;
  }
}

export default SumaryDepService;
