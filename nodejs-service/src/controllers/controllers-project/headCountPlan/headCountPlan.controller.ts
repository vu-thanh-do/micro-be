import {
  Get,
  HttpCode,
  JsonController,
  Param,
  Req,
  Res,
} from "routing-controllers";
import { HeadCountRecruitEzV4 } from "../../../services/service-Ezv4/headcountDep";
import { inject } from "inversify";
import { Request, Response } from "express";
import { ResponseDataService } from "../../../services/services/response.service";
import { InfoUserEzV4 } from "../../../services/service-Ezv4/infoUserEzV4";
import DepartmentEzV4 from "../../../services/service-Ezv4/department";
import { IDataHeadCount, INameDep } from "../../../types/headCount.type";

@JsonController("/headCountPlan")
class HeadCountPlanController {
  private headCountRecruitEzV4: HeadCountRecruitEzV4;
  private responseDataService: ResponseDataService;
  private infoUserEzV4: InfoUserEzV4;
  private departmentEzV4: DepartmentEzV4;
  constructor(
    @inject(HeadCountRecruitEzV4) headCountRecruitEzV4: HeadCountRecruitEzV4,
    @inject(ResponseDataService) responseDataService: ResponseDataService,
    @inject(InfoUserEzV4) infoUserEzV4: InfoUserEzV4,
    @inject(DepartmentEzV4) departmentEzV4: DepartmentEzV4
  ) {
    this.headCountRecruitEzV4 = headCountRecruitEzV4;
    this.responseDataService = responseDataService;
    this.infoUserEzV4 = infoUserEzV4;
    this.departmentEzV4 = departmentEzV4;
  }
  @Get("/:code")
  @HttpCode(200)
  async getHeadCountByDep(@Req() request: Request, @Res() response: Response) {
    try {
      const { code } = request.params;
      const { year = "2025", department } = request.query as {
        year: string;
        department: string | null;
      };
      const dataInfoUser = await this.infoUserEzV4.getInfoUserFromCode(code);
      if (dataInfoUser.status_code == 200 && dataInfoUser.data[0].divisionId) {
        const data = (await this.headCountRecruitEzV4.getHeadCountByDiv(
          dataInfoUser.data[0].divisionId,
          year,
          department
        )) as IDataHeadCount[];
        const departmentIds = data.map((d) => d.DepartmentID);
        const divisionIds = data.map((d) => d.DivisionID);
        const uniqueIds = [...new Set([...departmentIds, ...divisionIds])];
        // vì bảng này đệ quy nên thêm id vào  1 mảng và  chỉ query 1 lần
        const nameMap: Record<number, INameDep> = {};
        for (const id of uniqueIds) {
          const nameData = (await this.departmentEzV4.getNameById(
            id
          )) as INameDep;
          nameMap[id] = nameData;
        }
        const infoNameDivAndDep = data.map((info) => ({
          ...info,
          DepartmentName: nameMap[info.DepartmentID]?.Name || null,
          DivisionName: nameMap[info.DivisionID]?.Name || null,
        }));
        return response.send(
          this.responseDataService.createResponse(
            200,
            infoNameDivAndDep,
            "success"
          )
        );
      } else {
        return response.send(
          this.responseDataService.createResponse(500, null, "error")
        );
      }
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
}
export default HeadCountPlanController;
