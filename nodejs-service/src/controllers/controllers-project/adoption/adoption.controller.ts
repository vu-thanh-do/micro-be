import {
  JsonController,
  Get,
  Post,
  Body,
  QueryParams,
  Res,
  UploadedFile,
  Param,
  Patch,
} from "routing-controllers";
import { inject, injectable } from "inversify";
import { AdoptionService } from "../../../services/services/adoption.service";
import AdoptionEzV4 from "../../../services/service-Ezv4/adoption";
import { query, response, Response } from "express";
import * as XLSX from "xlsx";
@JsonController("/adoption")
class AdoptionController {
  private adoptionService: AdoptionService;
  private adoptionEzV4: AdoptionEzV4;
  constructor(@inject(AdoptionService) adoptionService: AdoptionService, @inject(AdoptionEzV4) adoptionEzV4: AdoptionEzV4) {
    this.adoptionService = adoptionService;
    this.adoptionEzV4 = adoptionEzV4;
  }
  @Get("/load-recCode")
  async loadRecCode(@QueryParams() query: any, @Res() response: Response) {
    try {
      const { recCode } = query;
      const dataFromRecCode = await this.adoptionEzV4.getDataFromRecCode(recCode);
      return response.status(200).json({
        status: 200,
        message: "Lấy mã tuyển dụng thành công",
        data: dataFromRecCode,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi tải mã tuyển dụng",
        error: error.message,
      });
    }
  }
  @Post("/import-adoption-version-hr")
  async importAdoptionVersionHr(
    @UploadedFile("file", { required: true }) file: any,
    @Res() response: Response
  ) {
    try {
      const buffer = file.buffer;
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Lấy dữ liệu dạng mảng dòng
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: [
          "recCode",
          "name",
          "employeesCode",
          "base",
          "ges",
          "pfm",
          "specialAdj",
          "remark",
        ],
        range: 1, // Bỏ dòng tiêu đề nếu có
      }) as any[];
      const result: Record<string, any[]> = {
        recCode: [],
        name: [],
        employeesCode: [],
        base: [],
        ges: [],
        pfm: [],
        specialAdj: [],
        remark: [],
      };
      for (const row of rows) {
        for (const key in result) {
          result[key].push(row[key] ?? null);
        }
      }
      return response.status(200).json({
        status: 200,
        message: "Đọc file thành công",
        data: result,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi tạo yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }
  @Post("/import-adoption-version-user")
  async importAdoptionVersionUser(
    @UploadedFile("file", { required: true }) file: any,
    @Res() response: Response
  ) {
    try {
      const buffer = file.buffer;
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Lấy dữ liệu dạng mảng dòng
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: [
          "recCode",
          "name",
          "employeesCode",
          "section",
          "group",
          "team",
          "workingGroup",
        ],
        range: 1, // Bỏ dòng tiêu đề nếu có
      }) as any[];
      const result: Record<string, any[]> = {
        recCode: [],
        name: [],
        employeesCode: [],
        section: [],
        group: [],
        team: [],
        workingGroup: [],
      };
      for (const row of rows) {
        for (const key in result) {
          result[key].push(row[key] ?? null);
        }
      }
      return response.status(200).json({
        status: 200,
        message: "Đọc file thành công",
        data: result,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi tạo yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }
  @Post("/insert-adoption-version-hr")
  async insertAdoptionVersionHr(@Body() body: any, @Res() response: Response) {
    try {
      const dataAdoptionVersionHr = {
        recCode: body.recCode,
        requestRecruitment: body.requestRecruitment,
        createdBy: {
          userId: body.createdBy.userId,
          name: body.createdBy.name,
          RequesterName: body.createdBy.RequesterName,
          RequesterCode: body.createdBy.RequesterCode,
          RequesterPosition: body.createdBy.RequesterPosition,
        },
        type: body.type,
        status: body.status,
        remark: body.remark,
      };
      console.log(dataAdoptionVersionHr);
      const dataAdoption =
        await this.adoptionService.insertDataAdoptionVersionHr(
          dataAdoptionVersionHr
        );
      return response.status(200).json({
        status: 200,
        message: "Thêm dữ liệu thành công",
        data: dataAdoption,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi thêm dữ liệu",
        error: error.message,
      });
    }
  }
  @Get("/getAll-adoption-admin")
  async getAllAdoptionAdmin(
    @QueryParams() query: any,
    @Res() response: Response
  ) {
    try {
      const { page, limit, type, status, recCode, startDate, endDate } = query;
      const adoption = await this.adoptionService.getAllAdoptionAdmin(
        page,
        limit,
        type,
        status,
        recCode,
        startDate,
        endDate
      );
      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng thành công",
        data: adoption,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy danh sách yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }
  @Get("/getAll-recode")
  async getAllRecode(@QueryParams() query: any, @Res() response: Response) {
    try {
      const { page, limit, recCode } = query;
      const adoption = await this.adoptionService.getAllRecCodeAdoption(
        page,
        limit,
        recCode
      );
      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng thành công",
        data: adoption,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy danh sách yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }
  @Post("/create-adoption-version-hr")
  async createAdoptionVersionHr(@Body() data: any, @Res() response: Response) {
    try {
      const {
        recCode,
        type,
        userId,
        name,
        CreateByName,
        CreateByCode,
        CreateByPosition,
        detailEmployees,
        levelApproval,
        hrResponse,
      } = data;
      if (!recCode) {
        return response.status(400).json({
          status: 400,
          message: "recCode là bắt buộc",
          data: null,
        });
      }
      const checkRecCode = await this.adoptionService.checkRecCode(recCode);
      if (checkRecCode) {
        return response.status(400).json({
          status: 400,
          message: "Mã tuyển dụng đã tồn tại",
          data: null,
        });
      }

      if (
        !detailEmployees ||
        !Array.isArray(detailEmployees) ||
        detailEmployees.length === 0
      ) {
        return response.status(400).json({
          status: 400,
          message: "detailEmployees là bắt buộc và phải là một mảng không rỗng",
          data: null,
        });
      }

      // Validate từng nhân viên
      const filteredEmployees = detailEmployees.map((employee, idx) => {
        return {
          name: employee.name,
          employeeCode: employee.employeeCode,
          base: employee.base,
          ges: employee.ges,
          pfm: employee.pfm,
          specialAdj: employee.specialAdj,
          remark: employee.remark,
          dob: employee.dob,
          entryDate: employee.entryDate,
          sex: employee.sex,
          address: employee.address,
          interviewResult: employee.interviewResult,
          healthResult: employee.healthResult,
          adoptResult: employee.adoptResult,
          section: employee.section,
          group: employee.group,
          team: employee.team,
          workingGroup: employee.workingGroup,
          position: employee.position,
          grade: employee.grade,
        };
      });
      // Validate hrResponse

      const adoptionDetail = {
        detailEmployees: filteredEmployees,
        levelApproval: levelApproval || [],
      };
      const dataCreate = await this.adoptionService.createAdoptionVersionHR(
        recCode,
        type,
        userId,
        name,
        CreateByName,
        CreateByCode,
        CreateByPosition,
        adoptionDetail,
        hrResponse
      );
      console.log(dataCreate, "dataCreate");
      return response.status(201).json({
        status: 201,
        message: "Tạo yêu cầu adoption thành công",
        data: dataCreate,
      });
    } catch (error: any) {
      console.log(error.message, "cc");
      const errRes =
        typeof error === "object" && error.status
          ? error
          : {
              status: 500,
              message: "Lỗi khi tạo yêu cầu adoption",
              error: error.message || error.toString(),
            };

      return response.status(errRes.status).json(errRes);
    }
  }
  @Get("/get-adoption-details/:adoptionId")
  async getAdoptionDetails(
    @Param("adoptionId") adoptionId: string,
    @QueryParams() query: any,
    @Res() response: Response
  ) {
    try {
      const { batchNumber } = query;
      // Sử dụng batchNumber từ query nếu có, hoặc sử dụng "latest" để lấy batch mới nhất
      const selectedBatchParam = batchNumber || "latest";
      const result = await this.adoptionService.getAdoptionDetails(
        adoptionId,
        selectedBatchParam
      );
      if (!result || (result as any).status === 400) {
        return response.status(404).json({
          status: 404,
          message:
            (result as any)?.message || "Không tìm thấy dữ liệu adoption",
          data: null,
        });
      }
      // Lấy số batch thực tế đã được chọn (có thể là từ tham số hoặc batch mới nhất)
      const actualSelectedBatch =
        selectedBatchParam === "latest"
          ? (result as any).latestBatch
          : selectedBatchParam;

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách chi tiết adoption thành công",
        data: {
          selectedBatch: actualSelectedBatch,
          dataAdoption: (result as any).dataAdoption,
          adoptionDetails: (result as any).adoptionDetails,
          totalBatch: (result as any).totalBatch,
          dateEachBatch: (result as any).dateEachBatch,
          latestBatch: (result as any).latestBatch,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy danh sách chi tiết adoption",
        error: error.message,
      });
    }
  }
  @Get("/get-adoption/:adoptionId")
  async getAdoption(
    @Param("adoptionId") adoptionId: string,
    @Res() response: Response
  ) {
    try {
      const adoption = await this.adoptionService.getAdoption(adoptionId);

      if (!adoption) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy adoption",
          data: null,
        });
      }

      // Lấy tất cả detail liên quan đến adoption này
      const adoptionDetails =
        await this.adoptionService.getAdoptionDetails(adoptionId);

      // Trả về thông tin adoption cùng với danh sách các detail
      return response.status(200).json({
        status: 200,
        message: "Lấy thông tin adoption thành công",
        data: {
          adoption: adoption,
          // details: adoptionDetails.map(detail => ({
          //   _id: detail._id,
          //   batchNumber: detail.batchNumber,
          //   quantity: detail.quantity,
          //   type: detail.type,
          //   status: detail.status,
          //   createdAt: detail.createdAt
          // }))
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy thông tin adoption",
        error: error.message,
      });
    }
  }
  @Get("/get-adoption-detail/:detailId")
  async getAdoptionDetailById(
    @Param("detailId") detailId: string,
    @Res() response: Response
  ) {
    try {
      const adoptionDetail =
        await this.adoptionService.getAdoptionDetailById(detailId);

      if (!adoptionDetail) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy chi tiết adoption",
          data: null,
        });
      }

      return response.status(200).json({
        status: 200,
        message: "Lấy chi tiết adoption thành công",
        data: adoptionDetail,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy chi tiết adoption",
        error: error.message,
      });
    }
  }
  @Patch("/approve-adoption-detail/:detailId")
  async approveAdoptionDetail(
    @Param("detailId") detailId: string,
    @Body() data: any,
    @Res() response: Response
  ) {
    try {
      const {
        approverId,
        approverName,
        approverCode,
        level,
        status,
        reasonReject,
        comment,
        nextApproverCode,
        nextApproverName,
      } = data;

      // Kiểm tra dữ liệu đầu vào
      if (!approverId || !approverName || !level || !status) {
        return response.status(400).json({
          status: 400,
          message: "Thiếu thông tin người phê duyệt hoặc cấp phê duyệt",
          data: null,
        });
      }

      if (status !== "approved" && status !== "rejected") {
        return response.status(400).json({
          status: 400,
          message: "Trạng thái phê duyệt không hợp lệ",
          data: null,
        });
      }

      // Nếu từ chối mà không có lý do
      if (status === "rejected" && !reasonReject) {
        return response.status(400).json({
          status: 400,
          message: "Cần cung cấp lý do từ chối",
          data: null,
        });
      }

      const result = await this.adoptionService.approveAdoptionDetail(
        detailId,
        {
          approverId,
          approverName,
          approverCode,
          level,
          status,
          reasonReject,
          comment,
          nextApproverCode,
          nextApproverName,
        }
      );

      if (!result.success || !result.data) {
        return response.status(400).json({
          status: 400,
          message: result.message || "Thất bại khi phê duyệt",
          data: null,
        });
      }

      // Nếu chi tiết được phê duyệt thành công ở cấp cuối
      if (
        status === "approved" &&
        result.data.isLastLevel &&
        result.data.adoptionId
      ) {
        await this.adoptionService.updateAdoptionStatusIfAllApproved(
          result.data.adoptionId.toString()
        );
      }

      return response.status(200).json({
        status: 200,
        message: `Yêu cầu đã được ${status === "approved" ? "phê duyệt" : "từ chối"} thành công`,
        data: result.data,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi phê duyệt chi tiết adoption",
        error: error.message,
      });
    }
  }
  @Post("/create-adoption-batch/:adoptionId")
  async createAdoptionBatch(
    @Param("adoptionId") adoptionId: string,
    @Body() data: any,
    @Res() response: Response
  ) {
    try {
      console.log(adoptionId, "adoptionId");
      const { detailEmployees, batchNumber, levelApproval, hrResponse } = data;
      if (
        !detailEmployees ||
        !Array.isArray(detailEmployees) ||
        detailEmployees.length === 0
      ) {
        return response.status(400).json({
          status: 400,
          message: "detailEmployees là bắt buộc và phải là một mảng không rỗng",
          data: null,
        });
      }
      if (!batchNumber) {
        return response.status(400).json({
          status: 400,
          message: "batchNumber là bắt buộc",
          data: null,
        });
      }
      // Lọc và chỉ giữ lại các trường cần thiết trong mỗi nhân viên
      const filteredEmployees = detailEmployees.map((employee) => ({
        name: employee.name,
        employeesCode: employee.employeesCode,
        base: employee.base,
        ges: employee.ges,
        pfm: employee.pfm,
        specialAdj: employee.specialAdj,
        remark: employee.remark,
      }));
      const result = await this.adoptionService.createAdoptionBatch(
        adoptionId,
        {
          batchNumber,
          detailEmployees: filteredEmployees,
          levelApproval: levelApproval || [],
          hrResponse: hrResponse,
        }
      );

      if (!result.success) {
        return response.status(400).json({
          status: 400,
          message: result.message,
          data: null,
        });
      }

      return response.status(201).json({
        status: 201,
        message: "Tạo đợt adoption mới thành công",
        data: result.data,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi tạo đợt adoption mới",
        error: error.message,
      });
    }
  }
  @Get("/get-approval-history/:detailId")
  async getApprovalHistory(
    @Param("detailId") detailId: string,
    @Res() response: Response
  ) {
    try {
      const approvalHistory =
        await this.adoptionService.getApprovalHistory(detailId);

      return response.status(200).json({
        status: 200,
        message: "Lấy lịch sử phê duyệt thành công",
        data: approvalHistory,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy lịch sử phê duyệt",
        error: error.message,
      });
    }
  }
  @Get("/getall-adoption-user/:userId")
  async getAllAdoptionUser(
    @Param("userId") userId: string,
    @QueryParams() query: any = 1,
    @Res() response: Response
  ) {
    try {
      const { page, limit, search, startDate, endDate, type, status } = query;
      const result = await this.adoptionService.getAllAdoptionUser(userId, {
        page,
        limit,
        search,
        startDate,
        endDate,
        type,
        status,
      });

      if (!result.success) {
        return response.status(400).json({
          status: 400,
          message: result.message,
          data: null,
        });
      }

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách adoption thành công",
        data: result.data,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi xuất dữ liệu adoption",
        error: error.message,
      });
    }
  }
  @Get("/export-data-adoption")
  async exportDataAdoption(
    @QueryParams() query: any,
    @Res() response: Response
  ) {
    try {
      const { adoptionId, batchNumber = "0" } = query;
      if (!adoptionId) {
        return response.status(400).json({
          status: 400,
          message: "Thiếu thông tin adoptionId",
          data: null,
        });
      }
      const result = await this.adoptionService.exportDataAdoption(
        adoptionId,
        batchNumber
      );
      if (!result.success || !result.data) {
        return response.status(404).json({
          status: 404,
          message: result.message || "Không tìm thấy dữ liệu để xuất",
          data: null,
        });
      }
      // Tạo workbook
      const workbook = XLSX.utils.book_new();
      // Tạo worksheet cho metadata
      const metadataWS = XLSX.utils.json_to_sheet(result.data.metadata);
      XLSX.utils.book_append_sheet(workbook, metadataWS, "Thông tin chung");
      // Tạo worksheet cho dữ liệu nhân viên
      const employeesWS = XLSX.utils.json_to_sheet(result.data.employees);
      XLSX.utils.book_append_sheet(
        workbook,
        employeesWS,
        "Danh sách nhân viên"
      );
      // Tạo buffer từ workbook
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });
      // Thiết lập headers để trình duyệt nhận biết đây là file để download
      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${result.data.filename}`
      );
      // Trả về buffer
      return response.send(excelBuffer);
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi xuất dữ liệu adoption",
        error: error.message,
      });
    }
  }
}
export default AdoptionController;
