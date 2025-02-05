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
        console.log(dataInfoUser, "dataInfoUser");
        // const newData = {
        //   employeeId: dataInfoUser.data.result.employeeId,
        //   departmentId: dataInfoUser.data.result.departmentId,
        //   divisionId: dataInfoUser.data.result.divisionId,
        //   sectionId: dataInfoUser.data.result.sectionId,
        //   groupId: dataInfoUser.data.result.groupId,
        // };
        const data = await this.headCountRecruitEzV4.getHeadCountByDiv(
          dataInfoUser.data[0].divisionId,
          year,
          department
        );
        return response.send(
          this.responseDataService.createResponse(200, data, "success")
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
