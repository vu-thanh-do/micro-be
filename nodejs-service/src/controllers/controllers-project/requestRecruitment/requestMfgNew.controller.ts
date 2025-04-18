import {
  JsonController,
  Post,
  Body,
  Res,
  HttpCode,
  Get,
  Req,
  Param,
  Put,
  Delete,
} from "routing-controllers";
import { Response, Request } from "express";
import { inject } from "inversify";
import { NotificationService } from "../../../services/services/notification.service";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import { INoti } from "../../../types/noti.type";
import RequestRecruitment from "../../../models/models-project/requestRecruitment.model";
import MfgRecruitmentRequest from "../../../models/models-project/mfgRecruitmentRequest.model";
import ApprovalHistory from "../../../models/models-project/approvalHistory.model";
import mongoose, { Types } from "mongoose";
import { IMfgRecruitmentRequest } from "../../../types/requestMfgnew.type";
import LineMfg from "../../../models/models-project/lineMfg.model";
import XLSX from "xlsx";

// Interface cho dữ liệu phê duyệt
interface IApprovalRequest {
  requestId: string;
  mfgRequestId: string;
  approverId: string;
  approverName: string;
  approverCode: string;
  level: number;
  status: "approved" | "rejected";
  reasonReject?: string;
  comment?: string;
  nextApproverCode?: string;
  nextApproverName?: string;
}

@JsonController("/requestRecruitment/mfgNew")
class RequestMfgNewController {
  private notiService: NotificationService;
  private uow: UnitOfWork;
  constructor(
    @inject(NotificationService) notiService: NotificationService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) {
    this.notiService = notiService;
    this.uow = uow;
  }
  // Phương thức chuyển đổi kiểu dữ liệu cho lines
  private convertLinesToMongoDBFormat(lines: any[] = []) {
    return lines.map((line) => ({
      id: line.id ? new Types.ObjectId(line.id) : new Types.ObjectId(),
      name: line.name || "",
      dailyVolume: line.dailyVolume || 0,
      standardPerson: line.standardPerson || 0,
      actualEmployeeNumber: line.actualEmployeeNumber || 0,
      requireNumber: line.requireNumber || 0,
      terminate: line.terminate || 0,
      pregnantLeave: line.pregnantLeave || 0,
      leaveAdjustment: line.leaveAdjustment || 0,
      actualComeBack: line.actualComeBack || 0,
    }));
  }
  // Phương thức chuyển đổi kiểu dữ liệu cho enterDate
  private convertEnterDatesToMongoDBFormat(enterDates: any[] = []) {
    return enterDates.map((item) => ({
      enterDate: item.enterDate ? new Date(item.enterDate) : new Date(),
      quantity: item.quantity || 0,
    }));
  }
  @Get("/export-template-mfg-new")
  @HttpCode(200)
  async handelExportTemplateMfgNew(@Res() response: Response) {
    try {
      const dataAllLineMfg = await LineMfg.find({ status: true });
      const workbook = XLSX.utils.book_new();
      const worksheetData = dataAllLineMfg.map(line => {
        const lineId = line._id && mongoose.Types.ObjectId.isValid(line._id) 
          ? line._id.toString()
          : '';
        return {
          "Mã": lineId,
          "Tên đơn vị/phòng ban": line.nameLine || '',
          "Sản lượng ngày": "",
          "Người cần thiết": "",
          "Người thực tế": "",
          "Số người yêu cầu": "",
          "Dự báo nghỉ việc": "",
          "Nghỉ thai sản": "",
          "Đối ứng nghỉ phép": "",
          "Người hỗ trợ quay lại thực tế": ""
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const columnWidths = [
        { wch: 24 }, // Mã
        { wch: 30 }, // Tên đơn vị/phòng ban
        { wch: 25 }, // Số lượng công việc hàng ngày
        { wch: 20 }, // Số người tiêu chuẩn
        { wch: 25 }, // Số lượng nhân viên hiện tại
        { wch: 20 }, // Số lượng yêu cầu
        { wch: 15 }, // Nghỉ việc
        { wch: 15 }, // Nghỉ thai sản
        { wch: 25 }, // Điều chỉnh nghỉ phép
        { wch: 25 }  // Số lượng quay lại thực tế
      ];
      worksheet['!cols'] = columnWidths;
      
      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template MFG");
      
      // Tạo buffer từ workbook
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer"
      });
      
      // Thiết lập headers cho response
      response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      response.setHeader("Content-Disposition", `attachment; filename=Template_MFG_${new Date().toISOString().slice(0, 10)}.xlsx`);
      // Gửi file về cho người dùng
      return response.send(excelBuffer);
    } catch (error: any) {
      console.error("Error occurred:", error);
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi xuất template tuyển dụng MFG",
        error: error.message,
      });
    }
  }
  @Post("/create")
  @HttpCode(201)
  async create(
    @Body() data: IMfgRecruitmentRequest,
    @Res() response: Response
  ) {
    try {
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }

      // 1. Tạo RequestRecruitment chung
      const requestData = {
        formType: "MFG",
        status: "pending",
        createdBy: {
          userId: data.userId || data.RequesterCode || "",
          name: data.RequesterName || "",
          RequesterName: data.RequesterName || "",
          RequesterCode: data.RequesterCode || "",
          RequesterPosition: data.RequesterPosition || "",
          RequesterSection: data.RequesterSection || "",
        },
        nameForm: data.nameForm || { title: "Yêu cầu tuyển dụng mới MFG" },
        deptCode: data.deptCode || "",
      };

      const requestRecruitment = new RequestRecruitment(requestData);
      await requestRecruitment.save({ session: sessionStart });

      // 2. Tạo MfgRecruitmentRequest với chuyển đổi kiểu dữ liệu
      const mfgRequestData = {
        year: data.year,
        month: data.month,
        recCode: data.recCode,
        lines: this.convertLinesToMongoDBFormat(data.lines),
        movement: data.movement,
        requireNumberAllLine: data.requireNumberAllLine,
        remainLastMonth: data.remainLastMonth,
        totalRequire: data.totalRequire,
        levelApproval:
          data.levelApproval?.map((level) => ({
            Id: level.Id || 1,
            level: level.level || 1,
            EmployeeId: level.EmployeeId || "",
            EmployeeName: level.EmployeeName || "",
          })) || [],
        conclusion: {
          total: {
            official: data.conclusion?.total?.official || 0,
            outsource: data.conclusion?.total?.outsource || 0,
            student: data.conclusion?.total?.student || 0,
          },
          education: data.conclusion?.education || "",
          age: data.conclusion?.age || "",
          gender: data.conclusion?.gender || "",
          physicalCondition: {
            male: {
              height: data.conclusion?.physicalCondition?.male?.height || 0,
              weight: data.conclusion?.physicalCondition?.male?.weight || 0,
            },
            female: {
              height: data.conclusion?.physicalCondition?.female?.height || 0,
              weight: data.conclusion?.physicalCondition?.female?.weight || 0,
            },
          },
          enterDate: this.convertEnterDatesToMongoDBFormat(
            data.conclusion?.enterDate
          ),
        },
        total: data.total,
        requestId: requestRecruitment._id,
      };

      const mfgRequest = new MfgRecruitmentRequest(mfgRequestData);
      await mfgRequest.save({ session: sessionStart });

      // 3. Tạo ApprovalHistory cho level đầu tiên (nếu có)
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstLevel = data.levelApproval[0];

        // Chỉ tạo ApprovalHistory nếu có thông tin người phê duyệt
        if (firstLevel.EmployeeId && firstLevel.EmployeeName) {
          const approvalHistoryData = {
            requestId: requestRecruitment._id,
            approvedBy: {
              userId: firstLevel.EmployeeId,
              name: firstLevel.EmployeeName,
              code: firstLevel.EmployeeId,
            },
            level: firstLevel.level || 1,
            status: "pending",
            approvedAt: new Date(),
          };

          const approvalHistory = new ApprovalHistory(approvalHistoryData);
          await approvalHistory.save({ session: sessionStart });
        }
      }

      // 4. Gửi thông báo cho người phê duyệt cấp 1
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstApprover = data.levelApproval[0];
        if (
          firstApprover.EmployeeId &&
          firstApprover.EmployeeId.trim() !== ""
        ) {
          const approverNotification: any = {
            title: "Yêu cầu tuyển dụng mới MFG",
            content: "Bạn có yêu cầu mới cần phê duyệt",
            type: "APPROVAL_NEEDED",
            userId: firstApprover.EmployeeId,
            role: "APPROVER",
            requestId: requestRecruitment._id,
            requestType: "MFG",
            isRead: false,
            metadata: {
              requestTitle: requestRecruitment.nameForm?.title || "",
              requesterName: requestRecruitment.createdBy?.RequesterName || "",
              requesterCode: requestRecruitment.createdBy?.RequesterCode || "",
              approvalLevel: 1,
              link: `/${requestRecruitment._id}`,
            },
          };

          try {
            await this.notiService.create(
              approverNotification as INoti,
              this.uow,
              sessionStart
            );
          } catch (error) {
            console.error("Error creating notification:", error);
          }
        }
      }

      // 5. Gửi thông báo cho admin
      const adminNotification: any = {
        title: "Yêu cầu tuyển dụng mới MFG",
        content: "Có yêu cầu tuyển dụng mới MFG",
        type: "NEW_REQUEST",
        userId: "ADMIN_ID",
        role: "ADMIN",
        requestId: requestRecruitment._id,
        requestType: "MFG",
        isRead: false,
        metadata: {
          requestTitle: requestRecruitment.nameForm?.title || "",
          requesterName: requestRecruitment.createdBy?.RequesterName || "",
          requesterCode: requestRecruitment.createdBy?.RequesterCode || "",
          link: `/${requestRecruitment._id}`,
        },
      };

      try {
        await this.notiService.create(
          adminNotification as INoti,
          this.uow,
          sessionStart
        );
      } catch (error) {
        console.error("Error creating notification:", error);
      }

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(201).json({
        status: 201,
        message: "Yêu cầu tuyển dụng mới MFG đã được tạo thành công",
        data: {
          requestId: requestRecruitment._id,
          mfgRequestId: mfgRequest._id,
          status: requestRecruitment.status,
          createdAt: requestRecruitment.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi tạo yêu cầu tuyển dụng mới MFG",
        error: error.message,
      });
    }
  }

  @Get("/get-all")
  @HttpCode(200)
  async getAllRequests(@Req() req: Request, @Res() response: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const processingCode = (req.query.processingCode as string) || "all";

      // Tạo filter
      const filter: any = {};

      if (search) {
        // Tìm kiếm trong các trường phù hợp
        filter.$or = [{ "lines.name": { $regex: search, $options: "i" } }];
      }

      if (status && status !== "all") {
        // Filter theo trạng thái của request
        const requestFilter = { status: status };
        const requestIds =
          await RequestRecruitment.find(requestFilter).distinct("_id");
        filter.requestId = { $in: requestIds };
      }

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Lấy danh sách yêu cầu tuyển dụng với phân trang
      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: "requestId",
      };

      const result = await (MfgRecruitmentRequest as any).paginate(
        filter,
        options
      );

      // Biến đổi dữ liệu trước khi trả về
      const transformedData = result.docs.map((doc: any) => {
        const requestData = doc.requestId || {};
        return {
          _id: doc._id,
          requestId: doc.requestId,
          year: doc.year,
          month: doc.month,
          recCode: doc.recCode,
          lines: doc.lines,
          movement: doc.movement,
          requireNumberAllLine: doc.requireNumberAllLine,
          remainLastMonth: doc.remainLastMonth,
          totalRequire: doc.totalRequire,
          conclusion: doc.conclusion,
          total: doc.total,
          levelApproval: doc.levelApproval,
          status: requestData.status || "pending",
          formType: requestData.formType || "MFG",
          createdBy: requestData.createdBy || {},
          nameForm: requestData.nameForm || {},
          processing: requestData.processing || {},
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      });

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng mới MFG thành công",
        data: transformedData,
        pagination: {
          totalDocs: result.totalDocs,
          limit: result.limit,
          totalPages: result.totalPages,
          page: result.page,
          hasPrevPage: result.hasPrevPage,
          hasNextPage: result.hasNextPage,
          prevPage: result.prevPage,
          nextPage: result.nextPage,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy danh sách yêu cầu tuyển dụng mới MFG",
        error: error.message,
      });
    }
  }

  @Get("/:id")
  @HttpCode(200)
  async getRequestById(@Param("id") id: string, @Res() response: Response) {
    try {
      // Kiểm tra định dạng ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
          status: 400,
          message: "ID yêu cầu không hợp lệ",
          data: null,
        });
      }
      
      // Lấy thông tin chi tiết yêu cầu tuyển dụng
      const mfgRequest = await MfgRecruitmentRequest.findOne({
        requestId: new mongoose.Types.ObjectId(id),
      }).populate("requestId");

      if (!mfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng mới MFG",
          data: null,
        });
      }

      // Lấy lịch sử phê duyệt
      const approvalHistory = await ApprovalHistory.find({
        requestId: id,
      }).sort({ level: 1, approvedAt: -1 });

      return response.status(200).json({
        status: 200,
        message: "Lấy thông tin yêu cầu tuyển dụng mới MFG thành công",
        data: {
          requestInfo: (mfgRequest as any).requestId,
          mfgRequest: mfgRequest,
          approvalHistory: approvalHistory,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin yêu cầu tuyển dụng mới MFG",
        error: error.message,
      });
    }
  }

  @Put("/edit/:id")
  @HttpCode(200)
  async editRequest(
    @Param("id") id: string,
    @Body() data: Partial<IMfgRecruitmentRequest>,
    @Res() response: Response
  ) {
    try {
      // Bắt đầu transaction
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }

      // 1. Kiểm tra yêu cầu tuyển dụng có tồn tại không
      const existingRequest = await RequestRecruitment.findById(id);
      if (!existingRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng",
          data: null,
        });
      }

      // 2. Kiểm tra yêu cầu tuyển dụng MFG có tồn tại không
      const existingMfgRequest = await MfgRecruitmentRequest.findOne({
        requestId: id,
      });
      if (!existingMfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng mới MFG",
          data: null,
        });
      }

      // 3. Kiểm tra trạng thái - chỉ cho phép sửa nếu yêu cầu chưa được phê duyệt hoặc từ chối
      if (existingRequest.status !== "pending") {
        return response.status(400).json({
          status: 400,
          message:
            "Không thể sửa yêu cầu đã được phê duyệt hoàn tất hoặc đã bị từ chối",
          data: null,
        });
      }

      // 4. Cập nhật thông tin yêu cầu tuyển dụng (nếu có)
      if (data.nameForm) existingRequest.nameForm = data.nameForm;

      // Kiểm tra và cập nhật thông tin người tạo nếu có
      if (existingRequest.createdBy) {
        if (data.RequesterName)
          existingRequest.createdBy.RequesterName = data.RequesterName;
        if (data.RequesterCode)
          existingRequest.createdBy.RequesterCode = data.RequesterCode;
        if (data.RequesterPosition)
          existingRequest.createdBy.RequesterPosition = data.RequesterPosition;
        if (data.RequesterSection)
          existingRequest.createdBy.RequesterSection = data.RequesterSection;
      }

      // 5. Cập nhật yêu cầu MFG (nếu có)
      if (data.year !== undefined) existingMfgRequest.year = data.year;
      if (data.month !== undefined) existingMfgRequest.month = data.month;
      if (data.recCode !== undefined) existingMfgRequest.recCode = data.recCode;

      // Cập nhật các trường khác nếu có - chuyển đổi kiểu dữ liệu
      if (data.lines)
        existingMfgRequest.lines = this.convertLinesToMongoDBFormat(data.lines);
      if (data.movement !== undefined)
        existingMfgRequest.movement = data.movement;
      if (data.requireNumberAllLine !== undefined)
        existingMfgRequest.requireNumberAllLine = data.requireNumberAllLine;
      if (data.remainLastMonth !== undefined)
        existingMfgRequest.remainLastMonth = data.remainLastMonth;
      if (data.totalRequire !== undefined)
        existingMfgRequest.totalRequire = data.totalRequire;

      // Cập nhật conclusion nếu có
      if (data.conclusion) {
        if (data.conclusion.total) {
          existingMfgRequest.conclusion.total.official =
            data.conclusion.total.official ||
            existingMfgRequest.conclusion.total.official;
          existingMfgRequest.conclusion.total.outsource =
            data.conclusion.total.outsource ||
            existingMfgRequest.conclusion.total.outsource;
          existingMfgRequest.conclusion.total.student =
            data.conclusion.total.student ||
            existingMfgRequest.conclusion.total.student;
        }

        if (data.conclusion.education)
          existingMfgRequest.conclusion.education = data.conclusion.education;
        if (data.conclusion.age)
          existingMfgRequest.conclusion.age = data.conclusion.age;
        if (data.conclusion.gender)
          existingMfgRequest.conclusion.gender = data.conclusion.gender;

        if (data.conclusion.physicalCondition) {
          if (data.conclusion.physicalCondition.male) {
            existingMfgRequest.conclusion.physicalCondition.male.height =
              data.conclusion.physicalCondition.male.height ||
              existingMfgRequest.conclusion.physicalCondition.male.height;
            existingMfgRequest.conclusion.physicalCondition.male.weight =
              data.conclusion.physicalCondition.male.weight ||
              existingMfgRequest.conclusion.physicalCondition.male.weight;
          }

          if (data.conclusion.physicalCondition.female) {
            existingMfgRequest.conclusion.physicalCondition.female.height =
              data.conclusion.physicalCondition.female.height ||
              existingMfgRequest.conclusion.physicalCondition.female.height;
            existingMfgRequest.conclusion.physicalCondition.female.weight =
              data.conclusion.physicalCondition.female.weight ||
              existingMfgRequest.conclusion.physicalCondition.female.weight;
          }
        }

        if (data.conclusion.enterDate && data.conclusion.enterDate.length > 0) {
          existingMfgRequest.conclusion.enterDate =
            this.convertEnterDatesToMongoDBFormat(data.conclusion.enterDate);
        }
      }

      // Cập nhật total nếu có
      if (data.total) {
        existingMfgRequest.total = {
          ...existingMfgRequest.total,
          ...data.total,
        };
      }

      // 6. Lưu thay đổi
      await existingRequest.save({ session: sessionStart });
      await existingMfgRequest.save({ session: sessionStart });

      // 7. Tạo bản ghi lịch sử cho việc chỉnh sửa
      const editHistoryData = {
        requestId: id,
        approvedBy: {
          userId: "system",
          name: "Hệ thống",
          code: "SYSTEM",
        },
        level: 0,
        status: "pending",
        approvedAt: new Date(),
        comment: "Yêu cầu đã được chỉnh sửa thông tin",
      };

      const editHistory = new ApprovalHistory(editHistoryData);
      await editHistory.save({ session: sessionStart });

      // 8. Gửi thông báo cho người phê duyệt hiện tại
      const currentApprover = existingMfgRequest.levelApproval.find(
        (level) => level.level === 1
      );

      if (currentApprover) {
        const approverNotification: any = {
          title: "Yêu cầu đã được chỉnh sửa",
          content:
            "Yêu cầu tuyển dụng mới MFG bạn đang phê duyệt đã được chỉnh sửa thông tin",
          type: "REQUEST_EDITED",
          userId: currentApprover.EmployeeId || ".",
          role: "APPROVER",
          requestId: id,
          requestType: "MFG",
          isRead: false,
          metadata: {
            requestTitle: existingRequest.nameForm?.title || "",
            requesterName: existingRequest.createdBy?.RequesterName || "",
            requesterCode: existingRequest.createdBy?.RequesterCode || "",
            approvalLevel: currentApprover.level,
            link: `/${id}`,
          },
        };

        await this.notiService.create(
          approverNotification as INoti,
          this.uow,
          sessionStart
        );
      }

      // 9. Gửi thông báo cho admin
      const adminNotification: any = {
        title: "Yêu cầu tuyển dụng được chỉnh sửa",
        content: "Có yêu cầu tuyển dụng mới MFG đã được chỉnh sửa thông tin",
        type: "REQUEST_EDITED",
        userId: "ADMIN_ID",
        role: "ADMIN",
        requestId: id,
        requestType: "MFG",
        isRead: false,
        metadata: {
          requestTitle: existingRequest.nameForm?.title || "",
          requesterName: existingRequest.createdBy?.RequesterName || "",
          requesterCode: existingRequest.createdBy?.RequesterCode || "",
          link: `/${id}`,
        },
      };

      await this.notiService.create(
        adminNotification as INoti,
        this.uow,
        sessionStart
      );

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: "Yêu cầu tuyển dụng mới MFG đã được cập nhật thành công",
        data: {
          requestId: existingRequest._id,
          mfgRequestId: existingMfgRequest._id,
          status: existingRequest.status,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi cập nhật yêu cầu tuyển dụng mới MFG",
        error: error.message,
      });
    }
  }

  @Post("/approve")
  @HttpCode(200)
  async approveRequest(
    @Body() data: IApprovalRequest,
    @Res() response: Response
  ) {
    try {
      // Bắt đầu transaction
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      // 1. Kiểm tra yêu cầu tuyển dụng có tồn tại không
      const requestRecruitment = await RequestRecruitment.findById(
        data.requestId
      );
      if (!requestRecruitment) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng",
          data: null,
        });
      }
      // 2. Kiểm tra yêu cầu tuyển dụng MFG có tồn tại không
      const mfgRequest = await MfgRecruitmentRequest.findById(
        data.mfgRequestId
      );
      if (!mfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng mới MFG",
          data: null,
        });
      }

      // 3. Kiểm tra cấp phê duyệt hiện tại
      const currentLevelIndex = mfgRequest.levelApproval.findIndex(
        (level) => level.level === data.level
      );

      if (currentLevelIndex === -1) {
        return response.status(400).json({
          status: 400,
          message: "Cấp phê duyệt không hợp lệ",
          data: null,
        });
      }

      // 4. Cập nhật trạng thái phê duyệt trong levelApproval
      mfgRequest.levelApproval[currentLevelIndex].EmployeeId = data.approverId;
      mfgRequest.levelApproval[currentLevelIndex].EmployeeName =
        data.approverName;

      // 5. Cập nhật trạng thái của yêu cầu tuyển dụng
      if (data.status === "rejected") {
        // Nếu từ chối, cập nhật trạng thái của yêu cầu thành rejected
        requestRecruitment.status = "rejected";

        // Gửi thông báo cho người tạo yêu cầu về việc từ chối
        const rejectNotification: any = {
          title: "Yêu cầu đã bị từ chối",
          content: `Yêu cầu tuyển dụng mới MFG của bạn đã bị ${data.approverName} từ chối`,
          type: "REQUEST_REJECTED",
          userId: requestRecruitment.createdBy?.userId || "",
          role: "USER",
          requestId: data.requestId,
          requestType: "MFG",
          isRead: false,
          metadata: {
            requestTitle: requestRecruitment.nameForm?.title || "",
            requesterName: requestRecruitment.createdBy?.RequesterName || "",
            requesterCode: requestRecruitment.createdBy?.RequesterCode || "",
            approvalLevel: data.level,
            actionBy: {
              name: data.approverName,
              code: data.approverCode,
            },
            reason: data.reasonReject || "",
            comment: data.comment || "",
            link: `/${data.requestId}`,
          },
        };

        await this.notiService.create(
          rejectNotification as INoti,
          this.uow,
          sessionStart
        );
      } else if (data.status === "approved") {
        // Kiểm tra xem đây có phải là cấp cuối cùng không
        const maxLevel = Math.max(
          ...mfgRequest.levelApproval.map((level) => level.level || 0)
        );
        const isLastLevel = data.level === maxLevel;

        if (isLastLevel) {
          // Nếu là cấp cuối cùng, cập nhật trạng thái thành approved
          requestRecruitment.status = "approved";

          // Gửi thông báo cho người tạo yêu cầu về việc hoàn thành
          const completeNotification: any = {
            title: "Yêu cầu đã được phê duyệt hoàn tất",
            content: `Yêu cầu tuyển dụng mới MFG của bạn đã được phê duyệt hoàn tất bởi ${data.approverName}`,
            type: "REQUEST_APPROVED",
            userId: requestRecruitment.createdBy?.userId || "",
            role: "USER",
            requestId: data.requestId,
            requestType: "MFG",
            isRead: false,
            metadata: {
              requestTitle: requestRecruitment.nameForm?.title || "",
              requesterName: requestRecruitment.createdBy?.RequesterName || "",
              requesterCode: requestRecruitment.createdBy?.RequesterCode || "",
              approvalLevel: data.level,
              actionBy: {
                name: data.approverName,
                code: data.approverCode,
              },
              comment: data.comment || "",
              link: `/${data.requestId}`,
            },
          };

          await this.notiService.create(
            completeNotification as INoti,
            this.uow,
            sessionStart
          );
        } else {
          // Nếu không phải cấp cuối cùng, cập nhật trạng thái thành pending
          requestRecruitment.status = "pending";

          // Tìm cấp phê duyệt tiếp theo
          const nextLevel = data.level + 1;
          const nextLevelIndex = mfgRequest.levelApproval.findIndex(
            (level) => level.level === nextLevel
          );

          if (nextLevelIndex !== -1) {
            // Nếu người phê duyệt hiện tại đã chọn người phê duyệt tiếp theo
            if (data.nextApproverCode && data.nextApproverName) {
              // Cập nhật thông tin người phê duyệt cho cấp tiếp theo
              mfgRequest.levelApproval[nextLevelIndex].EmployeeId =
                data.nextApproverCode;
              mfgRequest.levelApproval[nextLevelIndex].EmployeeName =
                data.nextApproverName;

              // Gửi thông báo cho người phê duyệt tiếp theo
              const nextApproverNotification: any = {
                title: "Bạn có yêu cầu mới cần phê duyệt",
                content: `Bạn có yêu cầu tuyển dụng mới MFG cần phê duyệt ở cấp ${nextLevel}`,
                type: "APPROVAL_NEEDED",
                userId: data.nextApproverCode,
                role: "APPROVER",
                requestId: data.requestId,
                requestType: "MFG",
                isRead: false,
                metadata: {
                  requestTitle: requestRecruitment.nameForm?.title || "",
                  requesterName:
                    requestRecruitment.createdBy?.RequesterName || "",
                  requesterCode:
                    requestRecruitment.createdBy?.RequesterCode || "",
                  approvalLevel: nextLevel,
                  actionBy: {
                    name: data.approverName,
                    code: data.approverCode,
                  },
                  link: `/${data.requestId}`,
                },
              };

              await this.notiService.create(
                nextApproverNotification as INoti,
                this.uow,
                sessionStart
              );
            }
          }

          // Gửi thông báo cho người tạo yêu cầu về tiến độ phê duyệt
          const progressNotification: any = {
            title: "Yêu cầu đã được phê duyệt một phần",
            content: `Yêu cầu tuyển dụng mới MFG của bạn đã được ${data.approverName} phê duyệt ở cấp ${data.level}`,
            type: "REQUEST_APPROVED",
            userId: requestRecruitment.createdBy?.userId || "",
            role: "USER",
            requestId: data.requestId,
            requestType: "MFG",
            isRead: false,
            metadata: {
              requestTitle: requestRecruitment.nameForm?.title || "",
              requesterName: requestRecruitment.createdBy?.RequesterName || "",
              requesterCode: requestRecruitment.createdBy?.RequesterCode || "",
              approvalLevel: data.level,
              actionBy: {
                name: data.approverName,
                code: data.approverCode,
              },
              comment: data.comment || "",
              link: `/${data.requestId}`,
            },
          };

          await this.notiService.create(
            progressNotification as INoti,
            this.uow,
            sessionStart
          );
        }
      }

      // 6. Lưu các thay đổi
      await requestRecruitment.save({ session: sessionStart });
      await mfgRequest.save({ session: sessionStart });

      // 7. Tạo lịch sử phê duyệt mới
      const approvalHistoryData = {
        requestId: data.requestId,
        approvedBy: {
          userId: data.approverId,
          name: data.approverName,
          code: data.approverCode,
        },
        level: data.level,
        status: data.status,
        approvedAt: new Date(),
        reasonReject: data.reasonReject || "",
        comment: data.comment || "",
        nextApprover: data.nextApproverCode
          ? {
              code: data.nextApproverCode,
              name: data.nextApproverName,
            }
          : undefined,
      };

      const approvalHistory = new ApprovalHistory(approvalHistoryData);
      await approvalHistory.save({ session: sessionStart });

      // 8. Thông báo cho admin
      const adminNotification: any = {
        title: `Yêu cầu tuyển dụng mới MFG đã được ${data.status === "approved" ? "phê duyệt" : "từ chối"}`,
        content: `Yêu cầu tuyển dụng mới MFG đã được ${data.approverName} ${data.status === "approved" ? "phê duyệt" : "từ chối"} ở cấp ${data.level}`,
        type:
          data.status === "approved" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
        userId: "ADMIN_ID",
        role: "ADMIN",
        requestId: data.requestId,
        requestType: "MFG",
        isRead: false,
        metadata: {
          requestTitle: requestRecruitment.nameForm?.title || "",
          requesterName: requestRecruitment.createdBy?.RequesterName || "",
          requesterCode: requestRecruitment.createdBy?.RequesterCode || "",
          approvalLevel: data.level,
          actionBy: {
            name: data.approverName,
            code: data.approverCode,
          },
          reason: data.reasonReject || "",
          comment: data.comment || "",
          link: `/${data.requestId}`,
        },
      };

      await this.notiService.create(
        adminNotification as INoti,
        this.uow,
        sessionStart
      );

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: `Yêu cầu tuyển dụng mới MFG đã được ${data.status === "approved" ? "phê duyệt" : "từ chối"} thành công`,
        data: {
          requestId: requestRecruitment._id,
          status: requestRecruitment.status,
          approvalLevel: data.level,
          approvalStatus: data.status,
          isLastLevel:
            data.level ===
            Math.max(
              ...mfgRequest.levelApproval.map((level) => level.level || 0)
            ),
          nextApprover: data.nextApproverCode
            ? {
                code: data.nextApproverCode,
                name: data.nextApproverName,
              }
            : undefined,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi phê duyệt yêu cầu tuyển dụng mới MFG",
        error: error.message,
      });
    }
  }

  @Post("/revise/:id")
  @HttpCode(200)
  async reviseRequest(
    @Param("id") id: string,
    @Body() data: IMfgRecruitmentRequest,
    @Res() response: Response
  ) {
    try {
      // Bắt đầu transaction
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }

      // 1. Kiểm tra yêu cầu tuyển dụng có tồn tại không
      const existingRequest = await RequestRecruitment.findById(id);
      if (!existingRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng",
          data: null,
        });
      }

      // 2. Kiểm tra yêu cầu tuyển dụng MFG có tồn tại không
      const existingMfgRequest = await MfgRecruitmentRequest.findOne({
        requestId: id,
      });
      if (!existingMfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng mới MFG",
          data: null,
        });
      }

      // 3. Cập nhật thông tin yêu cầu tuyển dụng
      existingRequest.status = "pending"; // Reset về trạng thái chờ phê duyệt
      existingRequest.nameForm = data.nameForm || {
        title: "Yêu cầu tuyển dụng mới MFG",
      };

      // Kiểm tra và cập nhật thông tin người tạo nếu có
      if (existingRequest.createdBy) {
        if (data.RequesterName)
          existingRequest.createdBy.RequesterName = data.RequesterName;
        if (data.RequesterCode)
          existingRequest.createdBy.RequesterCode = data.RequesterCode;
        if (data.RequesterPosition)
          existingRequest.createdBy.RequesterPosition = data.RequesterPosition;
        if (data.RequesterSection)
          existingRequest.createdBy.RequesterSection = data.RequesterSection;
      }

      // 4. Cập nhật yêu cầu MFG với chuyển đổi kiểu dữ liệu
      existingMfgRequest.year = data.year;
      existingMfgRequest.month = data.month;
      existingMfgRequest.recCode = data.recCode;
      existingMfgRequest.lines = this.convertLinesToMongoDBFormat(data.lines);
      existingMfgRequest.movement = data.movement;
      existingMfgRequest.requireNumberAllLine = data.requireNumberAllLine;
      existingMfgRequest.remainLastMonth = data.remainLastMonth;
      existingMfgRequest.totalRequire = data.totalRequire;

      // Cập nhật conclusion
      if (data.conclusion) {
        existingMfgRequest.conclusion = {
          total: {
            official: data.conclusion.total?.official || 0,
            outsource: data.conclusion.total?.outsource || 0,
            student: data.conclusion.total?.student || 0,
          },
          education: data.conclusion.education || "",
          age: data.conclusion.age || "",
          gender: data.conclusion.gender || "",
          physicalCondition: {
            male: {
              height: data.conclusion.physicalCondition?.male?.height || 0,
              weight: data.conclusion.physicalCondition?.male?.weight || 0,
            },
            female: {
              height: data.conclusion.physicalCondition?.female?.height || 0,
              weight: data.conclusion.physicalCondition?.female?.weight || 0,
            },
          },
          enterDate: this.convertEnterDatesToMongoDBFormat(
            data.conclusion.enterDate
          ),
        };
      }

      // Cập nhật total
      if (data.total) {
        existingMfgRequest.total = data.total;
      }

      // 5. Reset levelApproval
      if (data.levelApproval && data.levelApproval.length > 0) {
        // Xóa tất cả cấp phê duyệt hiện tại
        existingMfgRequest.levelApproval = [];

        // Thêm từng cấp phê duyệt mới
        data.levelApproval.forEach((level) => {
          existingMfgRequest.levelApproval.push({
            Id: level.Id || 1,
            level: level.level || 1,
            EmployeeId: level.EmployeeId || "",
            EmployeeName: level.EmployeeName || "",
          });
        });
      }

      // 6. Lưu thay đổi
      await existingRequest.save({ session: sessionStart });
      await existingMfgRequest.save({ session: sessionStart });

      // 7. Xóa tất cả lịch sử phê duyệt cũ
      await ApprovalHistory.deleteMany(
        { requestId: id },
        { session: sessionStart }
      );

      // 8. Tạo lịch sử phê duyệt mới cho cấp đầu tiên (nếu có)
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstLevel = data.levelApproval[0];
        const approvalHistoryData = {
          requestId: id,
          approvedBy: {
            userId: firstLevel.EmployeeId || "1",
            name: firstLevel.EmployeeName || "1",
            code: firstLevel.EmployeeId || "1",
          },
          level: firstLevel.level || 1,
          status: "pending",
          approvedAt: new Date(),
          comment: "Yêu cầu được làm mới và cần phê duyệt lại",
        };

        const approvalHistory = new ApprovalHistory(approvalHistoryData);
        await approvalHistory.save({ session: sessionStart });
      }

      // 9. Gửi thông báo cho người phê duyệt cấp 1
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstApprover = data.levelApproval[0];
        if (
          firstApprover.EmployeeId &&
          firstApprover.EmployeeId.trim() !== ""
        ) {
          const approverNotification: any = {
            title: "Yêu cầu cần phê duyệt lại",
            content:
              "Có yêu cầu tuyển dụng mới MFG đã được làm mới và cần phê duyệt lại",
            type: "APPROVAL_NEEDED",
            userId: firstApprover.EmployeeId,
            role: "APPROVER",
            requestId: id,
            requestType: "MFG",
            isRead: false,
            metadata: {
              requestTitle: existingRequest.nameForm?.title || "",
              requesterName: existingRequest.createdBy?.RequesterName || "",
              requesterCode: existingRequest.createdBy?.RequesterCode || "",
              approvalLevel: firstApprover.level,
              link: `/${id}`,
            },
          };

          await this.notiService.create(
            approverNotification as INoti,
            this.uow,
            sessionStart
          );
        }
      }

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: "Yêu cầu tuyển dụng mới MFG đã được cập nhật thành công",
        data: {
          requestId: existingRequest._id,
          mfgRequestId: existingMfgRequest._id,
          status: existingRequest.status,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi cập nhật yêu cầu tuyển dụng mới MFG",
        error: error.message,
      });
    }
  }
}

export default RequestMfgNewController;
