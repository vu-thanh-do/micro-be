import { Get, HttpCode, JsonController, Req, Res } from "routing-controllers";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import { FormTemplateService } from "../../../services/services/formTemplate.service";
import { inject } from "inversify";
import { Request, Response } from "express";

@JsonController("/formTemplate")
class FormTemplateController {
  private uow: UnitOfWork;
  private formTemplateService : FormTemplateService
  constructor(
    @inject(FormTemplateService) formTemplateService: FormTemplateService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) {
    this.formTemplateService = formTemplateService;
    this.uow = uow;
  }
  @Get("/")
  @HttpCode(200)
  async getAllFormTemplate(@Req() request : Request , @Res() response : Response){
    try {
        return response.send("ok")
    } catch (error :any) {
        return response.status(400).send({
            error: error.message
        })
    }
  }
}
export default FormTemplateController;
