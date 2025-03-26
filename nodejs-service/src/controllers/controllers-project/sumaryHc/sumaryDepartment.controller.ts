import { Request, Response } from "express";
import { inject } from "inversify";
import { Get, JsonController, Post, Req, Res, Body } from "routing-controllers";
import RequestRecruitment from "../../../models/models-project/requestRecruitment.model";
import SumaryDepService from "../../../services/services/sumaryDep.service";

@JsonController("/sumary-department")
class SumaryDepartmentController {
  private sumaryDepService: SumaryDepService;
  constructor(@inject(SumaryDepService) sumaryDepService: SumaryDepService) {
    this.sumaryDepService = sumaryDepService;
  }

  @Get("/info-headcount")
  async getInfoHeadcountSumary(
    @Req() request: Request,
    @Res() response: Response
  ) {
    try {
      const { year, div, dept } = request.query;
      const dataHeadcount = await this.sumaryDepService.infoHeadcountDepartment(year as string, div as string, dept as string);
      return response.status(200).json({
        message: "Success",
        data: dataHeadcount,
      });
    } catch (error: any) {
      return response.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  @Get("/detail-sumary")
  async getDetailSumary(@Req() request: Request, @Res() response: Response) {
    try {
      const { year, month, divCode, deptCode, page, limit } = request.query as any;
      if (!year || !month || !divCode ||  !page || !limit) {
        return response.status(400).json({
          message: "Missing required parameters",
        });
      }
      const dataSumaryDepartment =
        await this.sumaryDepService.getSumaryDepartment(
          year,
          month,
          divCode,
          deptCode,
          page,
          limit
        );
        return response.status(200).json({
          message: "Success",
          data: dataSumaryDepartment,
        });
    } catch (error: any) {
      return response.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
  @Post("/add-adjust")
  async addAdjust(@Req() request: Request, @Res() response: Response , @Body() body: {year: string, month: string, node: string, deptCode: string, adjust: number}) {
    try {
      const { year, month, node, deptCode, adjust } = body 
      if (!year || !month || !deptCode || !adjust) {
        return response.status(400).json({
          message: "Missing required parameters",
        });
      }
      const dataAdjust = await this.sumaryDepService.addAdjust(year as string, month as string, node as string, deptCode as string, adjust as number);
   
      if (!dataAdjust) {
        return response.status(400).json({
          message: "Failed to add adjust",
        });
      }
      return response.status(200).json({
        message: "Success",
        data: dataAdjust,
      });
    } catch (error: any) {
      return response.status(500).json({
        message: "Internal server error",
        error: error.message, 
      });
    }
  }
}
export default SumaryDepartmentController;
