import {
  Body,
  Get,
  HttpCode,
  JsonController,
  Post,
  Req,
  Res,
  Param,
  Put,
  Delete
} from "routing-controllers";
import { NotificationService } from "../../../services/services/notification.service";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import { inject } from "inversify";
import { Request, Response } from "express";
import MfgReplaceRecruitmentRequest from "../../../models/models-project/mfgReplaceRecruitmentRequest.model";
import RequestRecruitment from "../../../models/models-project/requestRecruitment.model";
import ApprovalHistory from "../../../models/models-project/approvalHistory.model";
import mongoose from "mongoose";

interface IMfgReplaceRequest {
  userId: string;
  year: number;
  month: number;
  recCode: number;
  division: string;
  department: string;
  position: string;
  grade: string;
  quantity: number;
  status: boolean;
  replacement: Array<{
    code: string;
    name: string;
    division: string;
    section: string;
    position: string;
    grade: string;
    entryDate: Date;
    actualLeaveDate: Date;
    note: string;
  }>;
  levelApproval: Array<any>;
  RequesterName: string;
  RequesterCode: string;
  RequesterPosition: string;
  RequesterSection: string;
  formType?: string;
  nameForm?: any;
}

interface IApprovalRequest {
  requestId: string;
  mfgRequestId: string;
  approverId: string;
  approverName: string;
  approverCode: string;
  level: number;
  status: 'approved' | 'rejected';
  reasonReject?: string;
  comment?: string;
  nextApproverCode?: string;
  nextApproverName?: string;
}

@JsonController("/requestRecruitment/mfgReplace")
class MfgReplaceRecuitmentController {
  private notiService: NotificationService;
  private uow: UnitOfWork;
  
  constructor(
    @inject(NotificationService) notiService: NotificationService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) { 
    this.notiService = notiService;
    this.uow = uow;
  }

  @Post("/create")
  @HttpCode(201)
  async create(@Body() data: IMfgReplaceRequest, @Res() response: Response) {
    try {
      // Bắt đầu transaction
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }

      // 1. Tạo RequestRecruitment chung
      const requestData = {
        formType: "MFGREPLACE",
        status: "pending",
        createdBy: {
          userId: data.userId || data.RequesterCode || "",
          name: data.RequesterName || "",
          RequesterName: data.RequesterName || "",
          RequesterCode: data.RequesterCode || "",
          RequesterPosition: data.RequesterPosition || "",
          RequesterSection: data.RequesterSection || "",
        },
        nameForm: data.nameForm || { title: "Yêu cầu tuyển dụng thay thế MFG" },
      };

      const requestRecruitment = new RequestRecruitment(requestData);
      await requestRecruitment.save({ session: sessionStart });

      // 2. Tạo MfgReplaceRecruitmentRequest
      const mfgRequestData = {
        requestId: requestRecruitment._id,
        year: data.year || new Date().getFullYear(),
        month: data.month || new Date().getMonth() + 1,
        recCode: data.recCode,
        division: data.division || "",
        department: data.department || "",
        position: data.position || "",
        grade: data.grade || "",
        quantity: data.quantity || 0,
        status: data.status || false,
        replacement: data.replacement || [],
        levelApproval: data.levelApproval?.map((level) => ({
          Id: level.Id || 1,
          level: level.level || 1,
          status: level.status || "pending",
          reasonReject: level.reasonReject || "N/A",
          approveTime: level.approveTime || new Date().toISOString(),
          codeUserApproval: level.codeUserApproval || "N/A",
          EmployeeId: level.EmployeeId || "N/A",
          EmployeeName: level.EmployeeName || "N/A",
          IsSelected: level.IsSelected || "N/A",
        })) || [],
      };

      const mfgRequest = new MfgReplaceRecruitmentRequest(mfgRequestData);
      await mfgRequest.save({ session: sessionStart });

      // 3. Tạo ApprovalHistory cho level đầu tiên (nếu có)
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstLevel = data.levelApproval[0];
        const approvalHistoryData = {
          requestId: requestRecruitment._id,
          approvedBy: {
            userId: firstLevel.codeUserApproval || firstLevel.EmployeeId || "N/A",
            name: firstLevel.EmployeeName || "N/A",
            code: firstLevel.EmployeeId || "N/A",
          },
          level: firstLevel.level || 1,
          status: "pending",
          approvedAt: new Date(),
          reasonReject: firstLevel.reasonReject || "",
        };

        const approvalHistory = new ApprovalHistory(approvalHistoryData);
        await approvalHistory.save({ session: sessionStart });
      }

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(201).json({
        status: 201,
        message: "Yêu cầu tuyển dụng thay thế MFG đã được tạo thành công",
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
        message: "Đã xảy ra lỗi khi tạo yêu cầu tuyển dụng thay thế MFG",
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
      // Tạo filter
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { "division": { $regex: search, $options: "i" } },
          { "department": { $regex: search, $options: "i" } },
          { "position": { $regex: search, $options: "i" } },
        ];
      }
      
      if (startDate && endDate) {
        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      // Lấy danh sách yêu cầu tuyển dụng với phân trang
      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: [
          {
            path: "requestId",
          },
        ],
      };
      
      const result = await (MfgReplaceRecruitmentRequest as any).paginate(
        filter,
        options
      );
      
      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng thay thế MFG thành công",
        data: result.docs,
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
        message: "Đã xảy ra lỗi khi lấy danh sách yêu cầu tuyển dụng thay thế MFG",
        error: error.message,
      });
    }
  }

  @Get("/:id")
  @HttpCode(200)
  async getRequestById(@Param("id") id: string, @Res() response: Response) {
    try {
      console.log(1,id)
      // Lấy thông tin chi tiết yêu cầu tuyển dụng
      const mfgRequest = await MfgReplaceRecruitmentRequest.findOne({ 
        requestId: new mongoose.Types.ObjectId(id) 
      }).populate("requestId");
        
      if (!mfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng thay thế MFG",
          data: null,
        });
      }
      
      // Lấy lịch sử phê duyệt
      const approvalHistory = await ApprovalHistory.find({
        requestId: id,
      }).sort({ level: 1, approvedAt: -1 });

      return response.status(200).json({
        status: 200,
        message: "Lấy thông tin yêu cầu tuyển dụng thay thế MFG thành công",
        data: {
          requestInfo: (mfgRequest as any).requestId,
          mfgRequest: mfgRequest,
          approvalHistory: approvalHistory,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin yêu cầu tuyển dụng thay thế MFG",
        error: error.message,
      });
    }
  }

  @Put("/edit/:id")
  @HttpCode(200)
  async editRequest(
    @Param("id") id: string,
    @Body() data: Partial<IMfgReplaceRequest>,
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
          data: null
        });
      }

      // 2. Kiểm tra yêu cầu tuyển dụng MFG có tồn tại không
      const existingMfgRequest = await MfgReplaceRecruitmentRequest.findOne({ requestId: id });
      if (!existingMfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng thay thế MFG",
          data: null
        });
      }

      // 3. Kiểm tra trạng thái - chỉ cho phép sửa nếu yêu cầu chưa được phê duyệt hoặc từ chối
      if (existingRequest.status !== "pending") {
        return response.status(400).json({
          status: 400,
          message: "Không thể sửa yêu cầu đã được phê duyệt hoàn tất hoặc đã bị từ chối",
          data: null
        });
      }

      // 4. Cập nhật thông tin yêu cầu tuyển dụng (nếu có)
      if (data.nameForm) existingRequest.nameForm = data.nameForm;
      
      // Kiểm tra và cập nhật thông tin người tạo nếu có
      if (existingRequest.createdBy) {
        if (data.RequesterName) existingRequest.createdBy.RequesterName = data.RequesterName;
        if (data.RequesterCode) existingRequest.createdBy.RequesterCode = data.RequesterCode;
        if (data.RequesterPosition) existingRequest.createdBy.RequesterPosition = data.RequesterPosition;
        if (data.RequesterSection) existingRequest.createdBy.RequesterSection = data.RequesterSection;
      }

      // 5. Cập nhật yêu cầu MFG (nếu có)
      if (data.year !== undefined) existingMfgRequest.year = data.year;
      if (data.month !== undefined) existingMfgRequest.month = data.month;
      if (data.recCode !== undefined) existingMfgRequest.recCode = data.recCode;
      if (data.division !== undefined) existingMfgRequest.division = data.division;
      if (data.department !== undefined) existingMfgRequest.department = data.department;
      if (data.position !== undefined) existingMfgRequest.position = data.position;
      if (data.grade !== undefined) existingMfgRequest.grade = data.grade;
      if (data.quantity !== undefined) existingMfgRequest.quantity = data.quantity;
      if (data.status !== undefined) existingMfgRequest.status = data.status;
      
      if (data.replacement && data.replacement.length > 0) {
        existingMfgRequest.replacement = data.replacement;
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

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: "Yêu cầu tuyển dụng thay thế MFG đã được cập nhật thành công",
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
        message: "Đã xảy ra lỗi khi cập nhật yêu cầu tuyển dụng thay thế MFG",
        error: error.message,
      });
    }
  }

  @Post("/approve")
  @HttpCode(200)
  async approveRequest(@Body() data: IApprovalRequest, @Res() response: Response) {
    try {
      // Bắt đầu transaction
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      
      // 1. Kiểm tra yêu cầu tuyển dụng có tồn tại không
      const requestRecruitment = await RequestRecruitment.findById(data.requestId);
      if (!requestRecruitment) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng",
          data: null
        });
      }
      
      // 2. Kiểm tra yêu cầu tuyển dụng MFG có tồn tại không
      const mfgRequest = await MfgReplaceRecruitmentRequest.findById(data.mfgRequestId);
      if (!mfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng thay thế MFG",
          data: null
        });
      }
      
      // 3. Kiểm tra cấp phê duyệt hiện tại
      const currentLevelIndex = mfgRequest.levelApproval.findIndex(
        level => level.level === data.level
      );
      
      if (currentLevelIndex === -1) {
        return response.status(400).json({
          status: 400,
          message: "Cấp phê duyệt không hợp lệ",
          data: null
        });
      }
      
      // 4. Cập nhật trạng thái phê duyệt trong levelApproval
      mfgRequest.levelApproval[currentLevelIndex].status = data.status;
      mfgRequest.levelApproval[currentLevelIndex].reasonReject = data.reasonReject || '';
      mfgRequest.levelApproval[currentLevelIndex].approveTime = new Date().toISOString();
      mfgRequest.levelApproval[currentLevelIndex].codeUserApproval = data.approverCode;
      mfgRequest.levelApproval[currentLevelIndex].EmployeeId = data.approverId;
      mfgRequest.levelApproval[currentLevelIndex].EmployeeName = data.approverName;
      
      // Cập nhật người được chọn để phê duyệt ở cấp tiếp theo (nếu có)
      if (data.nextApproverCode) {
        mfgRequest.levelApproval[currentLevelIndex].IsSelected = data.nextApproverCode;
      }
      
      // 5. Cập nhật trạng thái của yêu cầu tuyển dụng
      if (data.status === 'rejected') {
        // Nếu từ chối, cập nhật trạng thái của yêu cầu thành rejected
        requestRecruitment.status = 'rejected';
      } else if (data.status === 'approved') {
        // Kiểm tra xem đây có phải là cấp cuối cùng không
        const maxLevel = Math.max(...mfgRequest.levelApproval.map(level => level.level || 0));
        const isLastLevel = data.level === maxLevel;
        
        if (isLastLevel) {
          // Nếu là cấp cuối cùng, cập nhật trạng thái thành completed
          requestRecruitment.status = 'approved';
          // Cập nhật trạng thái MFG request thành true (đã phê duyệt)
          mfgRequest.status = true;
        } else {
          // Nếu không phải cấp cuối cùng, cập nhật trạng thái thành pending
          requestRecruitment.status = 'pending';
          
          // Tìm cấp phê duyệt tiếp theo
          const nextLevel = data.level + 1;
          const nextLevelIndex = mfgRequest.levelApproval.findIndex(
            level => level.level === nextLevel
          );
          
          if (nextLevelIndex !== -1) {
            // Nếu người phê duyệt hiện tại đã chọn người phê duyệt tiếp theo
            if (data.nextApproverCode && data.nextApproverName) {
              // Cập nhật thông tin người phê duyệt cho cấp tiếp theo
              mfgRequest.levelApproval[nextLevelIndex].EmployeeId = data.nextApproverCode;
              mfgRequest.levelApproval[nextLevelIndex].EmployeeName = data.nextApproverName;
            } 
            // Nếu cấp trước đã chọn người phê duyệt (thông qua IsSelected)
            else if (mfgRequest.levelApproval[currentLevelIndex].IsSelected) {
              const selectedApproverCode = mfgRequest.levelApproval[currentLevelIndex].IsSelected;
              
              // Cập nhật thông tin người được chọn cho cấp tiếp theo
              mfgRequest.levelApproval[nextLevelIndex].EmployeeId = selectedApproverCode;
            }
          }
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
        reasonReject: data.reasonReject || '',
        comment: data.comment || '',
        nextApprover: data.nextApproverCode ? {
          code: data.nextApproverCode,
          name: data.nextApproverName
        } : undefined
      };

      const approvalHistory = new ApprovalHistory(approvalHistoryData);
      await approvalHistory.save({ session: sessionStart });

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: `Yêu cầu tuyển dụng thay thế MFG đã được ${data.status === 'approved' ? 'phê duyệt' : 'từ chối'} thành công`,
        data: {
          requestId: requestRecruitment._id,
          status: requestRecruitment.status,
          approvalLevel: data.level,
          approvalStatus: data.status,
          isLastLevel: data.level === Math.max(...mfgRequest.levelApproval.map(level => level.level || 0)),
          nextApprover: data.nextApproverCode ? {
            code: data.nextApproverCode,
            name: data.nextApproverName
          } : undefined,
          updatedAt: new Date()
        }
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi phê duyệt yêu cầu tuyển dụng thay thế MFG",
        error: error.message
      });
    }
  }

  @Post("/revise/:id")
  @HttpCode(200)
  async reviseRequest(
    @Param("id") id: string,
    @Body() data: IMfgReplaceRequest,
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
          data: null
        });
      }

      // 2. Kiểm tra yêu cầu tuyển dụng MFG có tồn tại không
      const existingMfgRequest = await MfgReplaceRecruitmentRequest.findOne({ requestId: id });
      if (!existingMfgRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng thay thế MFG",
          data: null
        });
      }

      // 3. Cập nhật thông tin yêu cầu tuyển dụng
      existingRequest.status = "pending"; // Reset về trạng thái chờ phê duyệt
      existingRequest.nameForm = data.nameForm || { title: "Yêu cầu tuyển dụng thay thế MFG" };
      
      // Kiểm tra và cập nhật thông tin người tạo nếu có
      if (existingRequest.createdBy) {
        if (data.RequesterName) existingRequest.createdBy.RequesterName = data.RequesterName;
        if (data.RequesterCode) existingRequest.createdBy.RequesterCode = data.RequesterCode;
        if (data.RequesterPosition) existingRequest.createdBy.RequesterPosition = data.RequesterPosition;
        if (data.RequesterSection) existingRequest.createdBy.RequesterSection = data.RequesterSection;
      }

      // 4. Cập nhật yêu cầu MFG
      if (data.year !== undefined) existingMfgRequest.year = data.year;
      if (data.month !== undefined) existingMfgRequest.month = data.month;
      if (data.recCode !== undefined) existingMfgRequest.recCode = data.recCode;
      if (data.division !== undefined) existingMfgRequest.division = data.division;
      if (data.department !== undefined) existingMfgRequest.department = data.department;
      if (data.position !== undefined) existingMfgRequest.position = data.position;
      if (data.grade !== undefined) existingMfgRequest.grade = data.grade;
      if (data.quantity !== undefined) existingMfgRequest.quantity = data.quantity;
      existingMfgRequest.status = false; // Reset về trạng thái chưa phê duyệt
      
      if (data.replacement && data.replacement.length > 0) {
        existingMfgRequest.replacement = data.replacement;
      }
      
      // 5. Reset levelApproval đúng cách với Mongoose
      if (data.levelApproval && data.levelApproval.length > 0) {
        // Xóa tất cả cấp phê duyệt hiện tại
        existingMfgRequest.levelApproval.splice(0, existingMfgRequest.levelApproval.length);
        
        // Thêm từng cấp phê duyệt mới
        data.levelApproval.forEach(level => {
          existingMfgRequest.levelApproval.push({
            Id: level.Id || 1,
            level: level.level || 1,
            status: level.status || "pending",
            reasonReject: level.reasonReject || "N/A",
            approveTime: level.approveTime || new Date().toISOString(),
            codeUserApproval: level.codeUserApproval || "N/A",
            EmployeeId: level.EmployeeId || "N/A",
            EmployeeName: level.EmployeeName || "N/A",
            IsSelected: level.IsSelected || "N/A",
          });
        });
      }

      // 6. Lưu thay đổi
      await existingRequest.save({ session: sessionStart });
      await existingMfgRequest.save({ session: sessionStart });

      // 7. Xóa tất cả lịch sử phê duyệt cũ
      await ApprovalHistory.deleteMany({ requestId: id }, { session: sessionStart });

      // 8. Tạo lịch sử phê duyệt mới cho cấp đầu tiên (nếu có)
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstLevel = data.levelApproval[0];
        const approvalHistoryData = {
          requestId: id,
          approvedBy: {
            userId: firstLevel.codeUserApproval || firstLevel.EmployeeId || "N/A",
            name: firstLevel.EmployeeName || "N/A",
            code: firstLevel.EmployeeId || "N/A",
          },
          level: firstLevel.level || 1,
          status: "pending",
          approvedAt: new Date(),
          reasonReject: "",
          comment: "Yêu cầu được làm mới và cần phê duyệt lại",
        };

        const approvalHistory = new ApprovalHistory(approvalHistoryData);
        await approvalHistory.save({ session: sessionStart });
      }

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: "Yêu cầu tuyển dụng thay thế MFG đã được làm mới thành công",
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
        message: "Đã xảy ra lỗi khi làm mới yêu cầu tuyển dụng thay thế MFG",
        error: error.message,
      });
    }
  }

  @Delete("/:id")
  @HttpCode(200)
  async deleteRequest(@Param("id") id: string, @Res() response: Response) {
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
          data: null
        });
      }

      // 2. Kiểm tra xem yêu cầu có đang trong quá trình phê duyệt không
      if (existingRequest.status !== "pending") {
        return response.status(400).json({
          status: 400,
          message: "Chỉ có thể xóa các yêu cầu đang chờ phê duyệt",
          data: null
        });
      }

      // 3. Xóa các bản ghi liên quan
      await MfgReplaceRecruitmentRequest.deleteOne({ requestId: id }, { session: sessionStart });
      await ApprovalHistory.deleteMany({ requestId: id }, { session: sessionStart });
      await RequestRecruitment.deleteOne({ _id: id }, { session: sessionStart });

      // Commit transaction
      await this.uow.commit();

      return response.status(200).json({
        status: 200,
        message: "Xóa yêu cầu tuyển dụng thay thế MFG thành công",
        data: null
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi xóa yêu cầu tuyển dụng thay thế MFG",
        error: error.message
      });
    }
  }

  @Get("/user/:userId")
  @HttpCode(200)
  async getUserRequests(@Param("userId") userId: string, @Req() req: Request, @Res() response: Response) {
    try {
      // Lấy các tham số phân trang và lọc
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder as string || 'desc';

      // Tìm tất cả RequestRecruitment của người dùng với formType = MFGREPLACE
      const filter = {
        'createdBy.userId': userId,
        'formType': 'MFGREPLACE'
      } as any;
      
      // Thêm các điều kiện lọc khác
      if (status && status !== 'all') {
        filter['status'] = status;
      }
      
      if (startDate && endDate) {
        filter['createdAt'] = { 
          $gte: new Date(startDate), 
          $lte: new Date(endDate) 
        };
      }

      // Xây dựng options cho phân trang
      const sortOption: any = {};
      sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Thực hiện query với phân trang
      const result = await (RequestRecruitment as any).paginate(
        filter,
        {
          page,
          limit,
          sort: sortOption
        }
      );

      // Nếu không tìm thấy yêu cầu nào, trả về mảng rỗng
      if (!result.docs || result.docs.length === 0) {
        return response.status(200).json({
          status: 200,
          message: "Không tìm thấy yêu cầu tuyển dụng thay thế MFG cho người dùng này",
          data: [],
          pagination: {
            totalDocs: 0,
            limit,
            totalPages: 0,
            page,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null,
          },
        });
      }

      // Lấy ID của các yêu cầu
      const requestIds = result.docs.map((req: { _id: string }) => req._id);

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng thay thế MFG thành công",
        data: requestIds,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy danh sách yêu cầu tuyển dụng thay thế MFG",
        error: error.message,
      });
    }
  }

}

export default MfgReplaceRecuitmentController;  