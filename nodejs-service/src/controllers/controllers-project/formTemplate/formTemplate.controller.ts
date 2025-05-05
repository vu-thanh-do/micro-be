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


// Thêm interfaces cho specificCodeApprove và excludeCodeApprove
interface ISpecificCodeApprove {
  _id?:string;
  employeeCode: string;
  employeeName?: string;
  employeeEmail?: string;
  deptId?: string;
  deptName?: string;
}

interface IExcludeCodeApprove {
  _id?: string;
  employeeCode: string;
  employeeName?: string;
  employeeEmail?: string;
  deptId?: string;
  deptName?: string;
} 

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
      const { codeUser, deptId } = request.query;
      
      if (!codeUser ) {
        return response.status(400).send({
          status: 400,
          message: "Thiếu thông tin codeUser ",
          data: null
        });
      }
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
      const dataInfoEZV4 = await this.infoUserEzV4.getInfoUserFromCode(
        codeUser as string
      );
      if (!dataInfoEZV4 || !dataInfoEZV4.data || !dataInfoEZV4.data[0]) {
        return response.status(404).send({
          status: 404,
          message: "Không tìm thấy thông tin người dùng",
          data: null
        });
      }
      const dataDivHeadUser = await this.infoUserEzV4.getDivHead(
        dataInfoEZV4.data[0].divisionId
      );
      const listSuvUser = dataInfoEZV4.data[0].lstSuv || [];
      const hrCodeApproval = dataTemplate.codeApproval.find((itc: any) => 
        itc._idCodeApproval.code === "HR"
      );

      let dataSuvHR = [];
      let dataDivHeadHr = [];

      // Nếu có HR approver, lấy thêm thông tin về cấp trên của họ
      if (hrCodeApproval && hrCodeApproval.pic && hrCodeApproval.pic.employeeCode) {
        const responseSUVHR = await this.infoUserEzV4.getInfoUserFromCode(
          hrCodeApproval.pic.employeeCode
        );
        
        if (responseSUVHR && responseSUVHR.data && responseSUVHR.data[0]) {
          dataSuvHR = responseSUVHR.data[0].lstSuv || [];
          
          // Lấy thông tin trưởng bộ phận của HR
          dataDivHeadHr = await this.infoUserEzV4.getDivHead(
            responseSUVHR.data[0].divisionId
          );
        }
      }

      // Lọc và sắp xếp codeApproval
      // 1. Lọc ra các codeApproval có status là "active"
      // 2. Sắp xếp theo indexSTT tăng dần
      const filteredCodeApproval = dataTemplate.codeApproval
        .filter((approval: any) => approval.status === "active")
        .sort((a: any, b: any) => a.indexSTT - b.indexSTT);

      // Xử lý từng codeApproval để loại bỏ excludeCodeApprove và thêm specificCodeApprove
      const processedCodeApproval = filteredCodeApproval.map((approval: any) => {
        // Tạo danh sách approvers ban đầu dựa trên loại của approval
        let approvers = [];
        const code = approval._idCodeApproval.code;
        
        // Xác định danh sách approvers ban đầu dựa trên loại code
        if (code === "SELF") {
          // Người dùng hiện tại
          approvers = dataInfoEZV4.data.map((user: any) => ({
            employeeId: user.employeeCode,
            employeeCode: user.employeeCode,
            employeeName: user.fullName,
            employeeEmail: user.email || '',
            deptId: user.departmentId?.toString() || ''
          }));
        } else if (code === "SUV") {
          // Cấp trên trực tiếp
          approvers = listSuvUser.map((suv: any) => ({
            employeeId: suv.employeeId,
            employeeCode: suv.employeeId,
            employeeName: suv.fullName,
            employeeEmail: suv.email || '',
            deptId: suv.departmentId?.toString() || ''
          }));
        } else if (code === "DIVHEAD") {
          // Trưởng bộ phận
          approvers = dataDivHeadUser.map((head: any) => ({
            employeeId: head.employeeId,
            employeeCode: head.employeeId,
            employeeName: head.fullName,
            employeeEmail: head.email || '',
            deptId: head.divisionID?.toString() || ''
          }));
        } else if (code === "HR" && approval.pic) {
          // HR - chỉ lấy từ pic đã được chỉ định
          approvers = [{
            employeeId: approval.pic.employeeCode,
            employeeCode: approval.pic.employeeCode,
            employeeName: approval.pic.employeeName,
            employeeEmail: approval.pic.employeeEmail || '',
            deptId: ''
          }];
        } else if (code === "HR_DIVHEAD") {
          // Trưởng bộ phận của HR
          approvers = dataDivHeadHr.map((head: any) => ({
            employeeId: head.employeeId,
            employeeCode: head.employeeId,
            employeeName: head.fullName,
            employeeEmail: head.email || '',
            deptId: head.divisionID?.toString() || ''
          }));
        } else if (code === "HR_SUV") {
          // Cấp trên của HR
          approvers = dataSuvHR.map((suv: any) => ({
            employeeId: suv.employeeId,
            employeeCode: suv.employeeId,
            employeeName: suv.fullName,
            employeeEmail: suv.email || '',
            deptId: suv.departmentId?.toString() || ''
          }));
        }

        // Loại bỏ các excludeCodeApprove nếu có
        if (approval.excludeCodeApprove && approval.excludeCodeApprove.length > 0) {
          // Lọc excludeCodeApprove theo deptId nếu có
          let filteredExcludeCodeApprove = [...approval.excludeCodeApprove];
          
          if (deptId) {
            // Nếu có deptId, chỉ lấy các excludeCodeApprove có deptId tương ứng hoặc không có deptId
            filteredExcludeCodeApprove = approval.excludeCodeApprove.filter((exclude: any) => 
              !exclude.deptId || exclude.deptId === deptId.toString()
            );
          }
          
          const excludeCodeList = filteredExcludeCodeApprove.map((exclude: any) => 
            exclude.employeeCode.toLowerCase()
          );
          
          approvers = approvers.filter((approver: any) => 
            !excludeCodeList.includes(approver.employeeCode.toLowerCase())
          );
        }

        // Thêm các specificCodeApprove nếu có
        if (approval.specificCodeApprove && approval.specificCodeApprove.length > 0) {
          // Lọc specificCodeApprove theo deptId nếu có
          let filteredSpecificCodeApprove = [...approval.specificCodeApprove];
          
          if (deptId) {
            // Nếu có deptId, chỉ lấy các specificCodeApprove có deptId tương ứng hoặc không có deptId
            filteredSpecificCodeApprove = approval.specificCodeApprove.filter((specific: any) => 
              !specific.deptId || specific.deptId === deptId.toString()
            );
            
            console.log(`Filtered specificCodeApprove for deptId ${deptId}: ${filteredSpecificCodeApprove.length} items`);
          }
          
          // Chuyển đổi specificCodeApprove thành định dạng approver
          const specificApprovers = filteredSpecificCodeApprove.map((specific: any) => ({
            employeeId: specific.employeeCode,
            employeeCode: specific.employeeCode,
            employeeName: specific.employeeName,
            employeeEmail: specific.employeeEmail || '',
            deptId: specific.deptId || ''
          }));
          
          // Thêm vào danh sách approvers, loại bỏ trùng lặp nếu có
          const existingCodes = approvers.map((a: any) => a.employeeCode.toLowerCase());
          
          specificApprovers.forEach((approver: any) => {
            if (!existingCodes.includes(approver.employeeCode.toLowerCase())) {
              approvers.push(approver);
              existingCodes.push(approver.employeeCode.toLowerCase());
            }
          });
        }

        // Trả về dữ liệu codeApproval đã xử lý
        return {
          _id: approval._id,
          _idCodeApproval: {
            _id: approval._idCodeApproval._id,
            label: approval._idCodeApproval.label,
            code: approval._idCodeApproval.code,
            status: approval._idCodeApproval.status,
            index: approval._idCodeApproval.index
          },
          status: approval.status,
          indexSTT: approval.indexSTT,
          approvers: approvers,
          // Thêm thông tin về specificCodeApprove và excludeCodeApprove đã được lọc
          originalConfig: {
            specificCodeApprove: deptId 
              ? approval.specificCodeApprove.filter((s: any) => !s.deptId || s.deptId === deptId.toString())
              : approval.specificCodeApprove,
            excludeCodeApprove: deptId
              ? approval.excludeCodeApprove.filter((e: any) => !e.deptId || e.deptId === deptId.toString())
              : approval.excludeCodeApprove,
            pic: approval.pic
          }
        };
      });

      return response.status(200).send({
        status: 200,
        message: "success",
        data: {
          formTemplate: {
            _id: dataTemplate._id,
            nameForm: dataTemplate.nameForm,
            typeForm: dataTemplate.typeForm,
            version: dataTemplate.version,
            dateApply: dataTemplate.dateApply,
            status: dataTemplate.status,
            fields: dataTemplate.fields
          },
          codeApproval: processedCodeApproval,
          approvalInfo: {
            dataDivHeadUser,
            listSuvUser,
            dataSuvHR,
            dataDivHeadHr
          },
          deptId: deptId || null
        }
      });
    } catch (error: any) {
      console.error("Error in getIdFormTemplate:", error);
      return response.status(500).send({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin form template",
        error: error.message
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

  @Post("/:id/code-approval")
  @HttpCode(201)
  async addCodeApproval(
    @Param("id") id: string,
    @Body() data: { _idCodeApproval: string; status: string; indexSTT: number },
    @Res() response: Response
  ) {
    try {
      const session = await this.uow.start();
      const formTemplate =
        await FormTemplate.findById(id).populate("codeApproval");

      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template không tìm thấy"
            )
          );
      }
      
      // Kiểm tra indexSTT có trùng trong cùng một form template không
      const existingIndex = formTemplate.codeApproval.find(
        (ca) => Number(ca.indexSTT) === Number(data.indexSTT)
      );
      if (existingIndex) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "indexSTT đã tồn tại trong form template này"
            )
          );
      }
      const existingCodeApproval = formTemplate.codeApproval.find(
        (ca) => ca._idCodeApproval.toString() === data._idCodeApproval
      );
      if (existingCodeApproval) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "codeApproval đã tồn tại trong form template này"
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
          "Thêm Code approval thành công"
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
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
                "indexSTT đã tồn tại trong form template này"
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
          "Cập nhật Code approval thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  // API quản lý pic
  @Post("/:id/code-approval/:codeApprovalId/pic")
  @HttpCode(201)
  async addPic(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Body() data: { employeeCode: string; employeeName: string; employeeEmail: string },
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      codeApproval.pic = data;
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          201,
          formTemplate,
          "Thêm PIC thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Put("/:id/code-approval/:codeApprovalId/pic")
  @HttpCode(200)
  async updatePic(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Body() data: { employeeCode?: string; employeeName?: string; employeeEmail?: string },
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      // Cập nhật từng trường của pic nếu có
      if (!codeApproval.pic) {
        codeApproval.pic = {
          employeeCode: "",
          employeeName: "",
          employeeEmail: ""
        };
      }

      if (data.employeeCode !== undefined) {
        codeApproval.pic.employeeCode = data.employeeCode;
      }
      if (data.employeeName !== undefined) {
        codeApproval.pic.employeeName = data.employeeName;
      }
      if (data.employeeEmail !== undefined) {
        codeApproval.pic.employeeEmail = data.employeeEmail;
      }

      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Cập nhật PIC thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Delete("/:id/code-approval/:codeApprovalId/pic")
  @HttpCode(200)
  async deletePic(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      codeApproval.pic = undefined; // Xóa trường pic
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Xóa PIC thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  // API quản lý specificCodeApprove
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
      const formTemplate =
        await FormTemplate.findById(id);
      if (!formTemplate) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      // Kiểm tra nếu đã tồn tại employeeCode trong specificCodeApprove
      const existingCode = codeApproval.specificCodeApprove.find(
        (item: any) => item.employeeCode === data.employeeCode && 
          (data.deptId ? item.deptId === data.deptId : !item.deptId)
      );
      
      if (existingCode) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Employee code này đã tồn tại trong specific code approve của department này"
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
          "Thêm Specific code approve thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Put("/:id/code-approval/:codeApprovalId/specific-code-approve/:specificId")
  @HttpCode(200)
  async updateSpecificCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("specificId") specificId: string,
    @Body() data: ISpecificCodeApprove,
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }
      const specificIndex = codeApproval.specificCodeApprove.findIndex(
        (specific: any) => specific._id.toString() === specificId
      );
      if (specificIndex === -1) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Specific code approve không tìm thấy"
            )
          );
      }
      const existingCode = codeApproval.specificCodeApprove.find(
        (item: any, index: number) => 
          index !== specificIndex &&
          item.employeeCode === data.employeeCode && 
          (data.deptId ? item.deptId === data.deptId : !item.deptId)
      );
      if (existingCode) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Employee code này đã tồn tại trong specific code approve của department này"
            )
          );
      }

      codeApproval.specificCodeApprove[specificIndex] = {
        ...codeApproval.specificCodeApprove[specificIndex],
        ...data,
        _id: codeApproval.specificCodeApprove[specificIndex]._id as string
      } as any;

      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Cập nhật Specific code approve thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Delete("/:id/code-approval/:codeApprovalId/specific-code-approve/:specificId")
  @HttpCode(200)
  async deleteSpecificCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("specificId") specificId: string,
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      const specificIndex = codeApproval.specificCodeApprove.findIndex(
        (specific: any) => specific._id.toString() === specificId
      );
      
      if (specificIndex === -1) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Specific code approve không tìm thấy"
            )
          );
      }

      // Xóa phần tử tại vị trí index
      codeApproval.specificCodeApprove.splice(specificIndex, 1);
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Xóa Specific code approve thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  // API quản lý excludeCodeApprove
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      // Kiểm tra nếu đã tồn tại employeeCode trong excludeCodeApprove
      const existingCode = codeApproval.excludeCodeApprove.find(
        (item: any) => item.employeeCode === data.employeeCode && 
          (data.deptId ? item.deptId === data.deptId : !item.deptId)
      );
      
      if (existingCode) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Employee code này đã tồn tại trong exclude code approve của department này"
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
          "Thêm Exclude code approve thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Put("/:id/code-approval/:codeApprovalId/exclude-code-approve/:excludeId")
  @HttpCode(200)
  async updateExcludeCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("excludeId") excludeId: string,
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      const excludeIndex = codeApproval.excludeCodeApprove.findIndex(
        (exclude: any) => exclude._id.toString() === excludeId
      );
      
      if (excludeIndex === -1) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Exclude code approve không tìm thấy"
            )
          );
      }

      // Kiểm tra nếu đã tồn tại employeeCode trong excludeCodeApprove khác
      const existingCode = codeApproval.excludeCodeApprove.find(
        (item: any, index: number) => 
          index !== excludeIndex &&
          item.employeeCode === data.employeeCode && 
          (data.deptId ? item.deptId === data.deptId : !item.deptId)
      );
      
      if (existingCode) {
        return response
          .status(400)
          .send(
            this.responseDataService.createResponse(
              400,
              null,
              "Employee code này đã tồn tại trong exclude code approve của department này"
            )
          );
      }

      codeApproval.excludeCodeApprove[excludeIndex] = {
        ...codeApproval.excludeCodeApprove[excludeIndex],
        ...data,
        _id: codeApproval.excludeCodeApprove[excludeIndex]._id as string
      } as any;

      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Cập nhật Exclude code approve thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }

  @Delete("/:id/code-approval/:codeApprovalId/exclude-code-approve/:excludeId")
  @HttpCode(200)
  async deleteExcludeCodeApprove(
    @Param("id") id: string,
    @Param("codeApprovalId") codeApprovalId: string,
    @Param("excludeId") excludeId: string,
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
              "Form template không tìm thấy"
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
              "Code approval không tìm thấy"
            )
          );
      }

      const excludeIndex = codeApproval.excludeCodeApprove.findIndex(
        (exclude: any) => exclude._id.toString() === excludeId
      );
      
      if (excludeIndex === -1) {
        return response
          .status(404)
          .send(
            this.responseDataService.createResponse(
              404,
              null,
              "Exclude code approve không tìm thấy"
            )
          );
      }

      // Xóa phần tử tại vị trí index
      codeApproval.excludeCodeApprove.splice(excludeIndex, 1);
      await formTemplate.save({ session });
      await this.uow.commit();

      return response.send(
        this.responseDataService.createResponse(
          200,
          formTemplate,
          "Xóa Exclude code approve thành công"
        )
      );
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(400).send({
        error: error.message,
      });
    }
  }
}

export default FormTemplateController;
