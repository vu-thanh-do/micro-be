import {
  Get,
  HttpCode,
  JsonController,
  Post,
  Put,
  Req,
  Res,
  Body,
  Param,
  Delete,
} from "routing-controllers";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import { FormTemplateService } from "../../../services/services/formTemplate.service";
import { inject } from "inversify";
import { Request, Response } from "express";
import { ResponseDataService } from "../../../services/services/response.service";
import { HeadCountRecruitEzV4 } from "../../../services/service-Ezv4/headcountDep";
import { InfoUserEzV4 } from "../../../services/service-Ezv4/infoUserEzV4";
import FormTemplate from "../../../models/models-project/formTemplate.model";
import mongoose from "mongoose";
import {
  ISpecificCodeApprove,
  IExcludeCodeApprove,
} from "../../../types/formTemplate.type";

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
      const formTemplates = await FormTemplate.find()
        .populate("codeApproval._idCodeApproval")
        .exec();
      return response.send(
        this.responseDataService.createResponse(200, formTemplates, "success")
      );
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
      const dataTemplate = await FormTemplate.findById(id)
        .populate("codeApproval._idCodeApproval")
        .exec();
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

  @Post("/:id/code-approval")
  @HttpCode(201)
  async addCodeApproval(
    @Param("id") id: string,
    @Body() data: { _idCodeApproval: string; status: string; indexSTT: number },
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id).populate('codeApproval');

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }
      console.log(formTemplate);
      // Kiểm tra indexSTT có trùng trong cùng một form template không
      const existingIndex = formTemplate.codeApproval.find(
        (ca) => (Number(ca.indexSTT) === Number(data.indexSTT))
      );
      if (existingIndex) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "indexSTT already exists in this form template"
            )
          );
      }
      const existingCodeApproval = formTemplate.codeApproval.find(
        (ca) => (ca._idCodeApproval.toString() === data._idCodeApproval)
      );
      if (existingCodeApproval) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "codeApproval already exists in this form template"
            )
          );
      }
      formTemplate.codeApproval.push({
        _idCodeApproval: new mongoose.Types.ObjectId(data._idCodeApproval),
        status: data.status,
        indexSTT: data.indexSTT,
        specificCodeApprove: [],
        excludeCodeApprove: [],
      });

      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          201,
          formTemplate,
          "Code approval added successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Put("/:id/code-approval/:codeApprovalId")
  @HttpCode(200)
  async updateCodeApproval(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Body() data: { status?: string; indexSTT?: number },
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id);

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      if (data.indexSTT !== undefined) {
        // Kiểm tra indexSTT có trùng trong cùng một form template không
        const existingIndex = formTemplate.codeApproval.find(
          (ca: any) =>
            ca.indexSTT === data.indexSTT &&
            ca._id.toString() !== codeApprovalId
        );
        if (existingIndex) {
          return response
            .status(400)
            .send(
              this.responseDataService.createResponse(
                400,
                null,
                "indexSTT already exists in this form template"
              )
            );
        }
        codeApproval.indexSTT = data.indexSTT;
      }

      if (data.status !== undefined) {
        codeApproval.status = data.status;
      }

      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Code approval updated successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Post("/:id/code-approval/:codeApprovalId/specific-code-approve")
  @HttpCode(201)
  async addSpecificCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Body() data: ISpecificCodeApprove,
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id).populate('codeApproval');
      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      codeApproval.specificCodeApprove.push(data);
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          201,
          formTemplate,
          "Specific code approve added successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Put("/:id/code-approval/:codeApprovalId/specific-code-approve/:index")
  @HttpCode(200)
  async updateSpecificCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("index") index: number,
    @Body() data: ISpecificCodeApprove,
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id).populate('codeApproval');

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      if (index >= codeApproval.specificCodeApprove.length) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Index out of bounds"
            )
          );
      }

      codeApproval.specificCodeApprove[index] = data;
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Specific code approve updated successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Post("/:id/code-approval/:codeApprovalId/exclude-code-approve")
  @HttpCode(201)
  async addExcludeCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Body() data: IExcludeCodeApprove,
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id);

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      codeApproval.excludeCodeApprove.push(data);
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          201,
          formTemplate,
          "Exclude code approve added successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Put("/:id/code-approval/:codeApprovalId/exclude-code-approve/:index")
  @HttpCode(200)
  async updateExcludeCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("index") index: number,
    @Body() data: IExcludeCodeApprove,
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id);

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      if (index >= codeApproval.excludeCodeApprove.length) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Index out of bounds"
            )
          );
      }

      codeApproval.excludeCodeApprove[index] = data;
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Exclude code approve updated successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Delete("/:id/code-approval/:codeApprovalId/specific-code-approve/:index")
  @HttpCode(200)
  async deleteSpecificCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("index") index: number,
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id);

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      if (index >= codeApproval.specificCodeApprove.length) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Index out of bounds"
            )
          );
      }

      // Xóa phần tử tại vị trí index
      codeApproval.specificCodeApprove.splice(index, 1);
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Specific code approve deleted successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Delete("/:id/code-approval/:codeApprovalId/exclude-code-approve/:index")
  @HttpCode(200)
  async deleteExcludeCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("index") index: number,
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate = await FormTemplate.findById(id);

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template not found"
            )
          );
      }

      const codeApproval = formTemplate.codeApproval.find(
        (ca: any) => ca._id.toString() === codeApprovalId
      );
      if (!codeApproval) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Code approval not found"
            )
          );
      }

      if (index >= codeApproval.excludeCodeApprove.length) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Index out of bounds"
            )
          );
      }

      // Xóa phần tử tại vị trí index
      codeApproval.excludeCodeApprove.splice(index, 1);
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Exclude code approve deleted successfully"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
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
