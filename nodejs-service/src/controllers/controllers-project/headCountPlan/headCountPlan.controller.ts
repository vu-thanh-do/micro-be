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

@JsonController("/headCountPlan")
class HeadCountPlanController {
  private headCountRecruitEzV4: HeadCountRecruitEzV4;
  private responseDataService: ResponseDataService;

  constructor(
    @inject(HeadCountRecruitEzV4) headCountRecruitEzV4: HeadCountRecruitEzV4,
    @inject(ResponseDataService) responseDataService: ResponseDataService
  ) {
    this.headCountRecruitEzV4 = headCountRecruitEzV4;
    this.responseDataService = responseDataService;
  }
  @Get("/")
  @HttpCode(200)
  async getHeadCountByDep(@Req() request: Request, @Res() response: Response) {
    try {
      const { code } = request.params;
      const data = await this.headCountRecruitEzV4.getHeadCountByDiv("16");
      return response.send(
        this.responseDataService.createResponse(200, data, "success")
      );
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
}
export default HeadCountPlanController;
