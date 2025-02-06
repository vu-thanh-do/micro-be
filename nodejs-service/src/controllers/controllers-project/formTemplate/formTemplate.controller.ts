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
import { Request, Response } from "express";
import { ResponseDataService } from "../../../services/services/response.service";

@JsonController("/formTemplate")
class FormTemplateController {
  private uow: UnitOfWork;
  private formTemplateService: FormTemplateService;
  private responseDataService: ResponseDataService;

  constructor(
    @inject(FormTemplateService) formTemplateService: FormTemplateService,
    @inject(UnitOfWork) uow: UnitOfWork,
    @inject(ResponseDataService) responseDataService: ResponseDataService
  ) {
    this.formTemplateService = formTemplateService;
    this.uow = uow;
    this.responseDataService = responseDataService;
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
}
export default FormTemplateController;
