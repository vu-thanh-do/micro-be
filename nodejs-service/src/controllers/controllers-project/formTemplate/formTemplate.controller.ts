import {
  Get,
  HttpCode,
  JsonController,
  Put,
  Req,
  Res,
} from "routing-controllers";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import { FormTemplateService } from "../../../services/services/formTemplate.service";
import { inject } from "inversify";
import { Request, response, Response } from "express";
import { ResponseDataService } from "../../../services/services/response.service";
import { HeadCountRecruitEzV4 } from "../../../services/service-Ezv4/headcountDep";
import { apiGetInfoUserEzV4 } from "../../../config/axios";
import { InfoUserEzV4 } from "../../../services/service-Ezv4/infoUserEzV4";

@JsonController("/formTemplate")
class FormTemplateController {
  private uow: UnitOfWork;
  private formTemplateService: FormTemplateService;
  private responseDataService: ResponseDataService;
  private headCountRecruitEzV4: HeadCountRecruitEzV4;
  private infoUserEzV4: InfoUserEzV4;
  constructor(
    @inject(FormTemplateService) formTemplateService: FormTemplateService,
    @inject(UnitOfWork) uow: UnitOfWork,
    @inject(ResponseDataService) responseDataService: ResponseDataService,
    @inject(HeadCountRecruitEzV4) headCountRecruitEzV4: HeadCountRecruitEzV4,
    @inject(InfoUserEzV4) infoUserEzV4: InfoUserEzV4
  ) {
    this.formTemplateService = formTemplateService;
    this.uow = uow;
    this.responseDataService = responseDataService;
    this.headCountRecruitEzV4 = headCountRecruitEzV4;
    this.infoUserEzV4 = infoUserEzV4;
  }
  @Get("/")
  @HttpCode(200)
  async getAllFormTemplate(@Req() request: Request, @Res() response: Response) {
    try {
      return response.send("ok");
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
  @Get("/get-by-id/:id")
  @HttpCode(200)
  async getIdFormTemplate(@Req() request: Request, @Res() response: Response) {
    try {
      const { id } = request.params;
      const dataTemplate = await this.formTemplateService.getById(id);
      if (!dataTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(404, null, "not found")
          );
      }
      return response
        .status(200)
        .send(
          this.responseDataService.createResponse(200, dataTemplate, "success")
        );
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
  @Put("/edit-form/:id")
  @HttpCode(200)
  async editFormTemplate(@Req() request: Request, @Res() response: Response) {
    try {
      return response.send("ok");
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
  @Get("/data-form-yctd-dept")
  @HttpCode(200)
  async getDataFormTemplate(
    @Req() request: Request,
    @Res() response: Response
  ) {
    const { idDep, idForm } = request.query as {
      idDep: string;
      idForm: string;
    };
    try {
      const data = (await this.headCountRecruitEzV4.checkResignByDept(
        idDep
      )) as any;
      const formData = await this.formTemplateService.getById(idForm);
      const dataResign = await Promise.all(
        data.map(async (mapDtEz: any) => {
          const dataRes = await this.infoUserEzV4.getInfoUserFromCode(
            mapDtEz.EmployeeCode
          );
          const userInfo = dataRes.data[0];
          const [dataNameDiv, dataNameDep, dataNameSec] = await Promise.all([
            this.headCountRecruitEzV4.getNameByID(userInfo.divisionId),
            this.headCountRecruitEzV4.getNameByID(userInfo.departmentId),
            this.headCountRecruitEzV4.getNameByID(userInfo.sectionId),
          ]);
          return {
            ID: mapDtEz.ID,
            EmployeeCode: mapDtEz.EmployeeCode,
            FullName: mapDtEz.FullName,
            ResignDate: mapDtEz.ResignDate,
            Position: userInfo.title_nm,
            Grade: userInfo.grade_cd,
            entryDate: mapDtEz.OfficialDate,
            actualLeaveDate: mapDtEz.ResignDate,
            dataNameDiv,
            dataNameDep,
            dataNameSec,
          };
        })
      );
      const dataResponse = {
        status: 200,
        message: "success",
        formData: formData,
        infoResign: dataResign,
      };
      return response.send(dataResponse);
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
  @Get("/get-name-structure")
  @HttpCode(200)
  async GetNameStructure(@Req() request: Request, @Res() response: Response) {
    try {
      const { idRoot, level } = request.query as {
        idRoot: string;
        level: string | null;
      };
      const responseEZ =
        await this.headCountRecruitEzV4.getNameCompanyStructure(
          Number(idRoot),
          Number(level)
        );
      return response.send(responseEZ);
    } catch (error: any) {
      return response.status(400).send({
        error: error.message,
      });
    }
  }
}
export default FormTemplateController;
