import { Get, HttpCode, JsonController, Req, Res } from "routing-controllers";
import { RequireDataService } from "../../../services/services/requireData.service";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import { inject } from "inversify";
import { Request, Response } from "express";
import DepartmentEzV4 from "../../../services/service-Ezv4/department";
import { sequelizeSql } from "../../../config/ezV4Db";

@JsonController("/requireData")
class RequireDataController {
  private requireDataService: RequireDataService;
  private uow: UnitOfWork;
  constructor(
    @inject(RequireDataService) requireDataService: RequireDataService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) {
    this.requireDataService = requireDataService;
    this.uow = uow;
  }
  @Get("/")
  @HttpCode(200)
  async getAllRequireData(@Req() request: Request, @Res() response: Response) {
    try {
    const a = new DepartmentEzV4()
     const b = await a.getAllDepartmenrtEzv4()
      console.log(b )
      return response.send(b);
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
}
export default RequireDataController;
