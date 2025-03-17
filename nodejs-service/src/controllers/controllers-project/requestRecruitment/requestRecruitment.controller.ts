import HttpError from "../../../errors/httpError";
import { INoti } from "../../../types/noti.type";
import { NotificationService } from "../../../services/services/notification.service";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import express, { Request, Response } from "express";
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
} from "routing-controllers";
import { inject, injectable } from "inversify";
import RequestRecruitment from "../../../models/models-project/requestRecruitment.model";
import DepartmentRecruitmentRequest from "../../../models/models-project/departmentRecruitmentRequest.mode";
import ApprovalHistory from "../../../models/models-project/approvalHistory.model";

interface IRecruitmentRequest {
  userId: string;
  positions: Array<any>;
  total: number;
  hrAnswer: {
    dateOfAdoption: string;
    numberOfAdopt: string;
    comment: string;
  };
  levelApproval: Array<any>;
  status: string;
  RequesterName: string;
  RequesterCode: string;
  RequesterPosition: string;
  RequesterSection: string;
  formType?: string;
  nameForm?: any;
}

// Interface cho dữ liệu phê duyệt
interface IApprovalRequest {
  requestId: string;
  departmentRequestId: string;
  approverId: string;
  approverName: string;
  approverCode: string;
  level: number;
  status: "approved" | "rejected";
  reasonReject?: string;
  comment?: string;
  nextApproverCode?: string; // Mã của người được chọn để phê duyệt tiếp theo
  nextApproverName?: string; // Tên của người được chọn để phê duyệt tiếp theo
}

@JsonController("/requestRecruitment")
class RequestRecruitmentController {
  private notiService: NotificationService;
  private uow: UnitOfWork;
  constructor(
    @inject(NotificationService) notiService: NotificationService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) {
    this.notiService = notiService;
    this.uow = uow;
  }

  @Post("/department/create")
  @HttpCode(201)
  async createRequestRecruitment(
    @Body() data: IRecruitmentRequest,
    @Res() response: Response
  ) {
    try {
      // Bắt đầu transaction
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      // 1. Tạo RequestRecruitment
      const requestData = {
        formType: data.formType || "YCTD",
        status: data.status || "pending",
        createdBy: {
          userId: data.userId || data.RequesterCode || "",
          name: data.RequesterName || "",
          RequesterName: data.RequesterName || "",
          RequesterCode: data.RequesterCode || "",
          RequesterPosition: data.RequesterPosition || "",
          RequesterSection: data.RequesterSection || "",
        },
        nameForm: data.nameForm || { title: "Yêu cầu tuyển dụng" },
      };

      const requestRecruitment = new RequestRecruitment(requestData);
      await requestRecruitment.save({ session: sessionStart });

      // 2. Tạo DepartmentRecruitmentRequest với giá trị mặc định cho các trường bắt buộc
      const departmentRequestData = {
        requestId: requestRecruitment._id,
        total: data.total || 0,
        hrAnswer: {
          dateOfAdoption: data.hrAnswer?.dateOfAdoption || "N/A",
          numberOfAdopt: data.hrAnswer?.numberOfAdopt || "0",
          comment: data.hrAnswer?.comment || "N/A",
        },
        positions: data.positions || [],
        levelApproval:
          data.levelApproval?.map((level) => ({
            Id: level.Id || 1,
            level: level.level || 1,
            status: level.status || "pending", // Giá trị mặc định cho status
            reasonReject: level.reasonReject || "N/A", // Giá trị mặc định
            approveTime: level.approveTime || new Date().toISOString(), // Giá trị mặc định
            codeUserApproval: level.codeUserApproval || "N/A", // Giá trị mặc định
            EmployeeId: level.EmployeeId || "N/A", // Giá trị mặc định
            EmployeeName: level.EmployeeName || "N/A", // Giá trị mặc định
            IsSelected: level.IsSelected || "N/A", // Giá trị mặc định
          })) || [],
        additionalInfo: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const departmentRequest = new DepartmentRecruitmentRequest(
        departmentRequestData
      );
      await departmentRequest.save({ session: sessionStart });

      // 3. Tạo ApprovalHistory cho level đầu tiên (nếu có)
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstLevel = data.levelApproval[0];
        const approvalHistoryData = {
          requestId: requestRecruitment._id,
          approvedBy: {
            userId:
              firstLevel.codeUserApproval || firstLevel.EmployeeId || "N/A",
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

      // 4. Gửi thông báo nếu cần
      // Tạo thông báo cho người phê duyệt cấp 1
      //   if (data.levelApproval && data.levelApproval.length > 0) {
      //     const firstApprover = data.levelApproval[0];
      //     if (firstApprover.EmployeeId) {
      //       const notificationData: INoti = {
      //         userId: firstApprover.EmployeeId,
      //         title: 'Yêu cầu phê duyệt mới',
      //         content: `Bạn có một yêu cầu tuyển dụng mới cần phê duyệt từ ${data.RequesterName || 'Người dùng'}`,
      //         isRead: false,
      //         type: 'approval',
      //         link: `/recruitment-requests/detail/${requestRecruitment._id}`,
      //         createdAt: new Date()
      //       };

      //       await this.notiService.create(notificationData, sessionStart);
      //     }
      //   }

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(201).json({
        status: 201,
        message: "Yêu cầu tuyển dụng đã được tạo thành công",
        data: {
          requestId: requestRecruitment._id,
          departmentRequestId: departmentRequest._id,
          status: requestRecruitment.status,
          createdAt: requestRecruitment.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi tạo yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }

  @Get("/department/get-all")
  @HttpCode(200)
  async getAllRequests(@Req() req: Request, @Res() response: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      console.log(req.query.search);
      // Tạo filter
      const filter: any = {};
      if (status != "all") {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { "requestId.formType": { $regex: search, $options: "i" } },
          { "requestId.RequesterCode": { $regex: search, $options: "i" } },
          { "requestId.RequesterName": { $regex: search, $options: "i" } },
          { "requestId.nameForm.title": { $regex: search, $options: "i" } },
        ];
      }
      if (startDate && endDate) {
        filter.createdAt = { $gte: startDate, $lte: endDate };
      }
      // Lấy danh sách yêu cầu tuyển dụng với phân trang
      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        select: "-positions",
        populate: [
          {
            path: "requestId",
          },
        ],
      };
      const result = await (DepartmentRecruitmentRequest as any).paginate(
        filter,
        options
      );
      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng thành công",
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
        message: "Đã xảy ra lỗi khi lấy danh sách yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }

  @Get("/department/:id")
  @HttpCode(200)
  async getRequestById(@Req() req: Request, @Res() response: Response) {
    try {
      const { id } = req.params;
      // Lấy thông tin chi tiết yêu cầu tuyển dụng
      const departmentRequest = await DepartmentRecruitmentRequest.findOne({
        requestId: id,
      }).populate("requestId");
      if (!departmentRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng",
          data: null,
        });
      }
      // Lấy lịch sử phê duyệt
      const approvalHistory = await ApprovalHistory.find({
        requestId: id,
      }).sort({ level: 1, approvedAt: -1 });

      return response.status(200).json({
        status: 200,
        message: "Lấy thông tin yêu cầu tuyển dụng thành công",
        data: {
          requestInfo: departmentRequest.requestId,
          departmentRequest: departmentRequest,
          approvalHistory: approvalHistory,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }

  @Post("/department/approve")
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

      // 2. Kiểm tra yêu cầu tuyển dụng phòng ban có tồn tại không
      const departmentRequest = await DepartmentRecruitmentRequest.findById(
        data.departmentRequestId
      );
      if (!departmentRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng phòng ban",
          data: null,
        });
      }

      // 3. Kiểm tra cấp phê duyệt hiện tại
      const currentLevelIndex = departmentRequest.levelApproval.findIndex(
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
      departmentRequest.levelApproval[currentLevelIndex].status = data.status;
      departmentRequest.levelApproval[currentLevelIndex].reasonReject =
        data.reasonReject || "";
      departmentRequest.levelApproval[currentLevelIndex].approveTime =
        new Date().toISOString();
      departmentRequest.levelApproval[currentLevelIndex].codeUserApproval =
        data.approverCode;
      departmentRequest.levelApproval[currentLevelIndex].EmployeeId =
        data.approverId;
      departmentRequest.levelApproval[currentLevelIndex].EmployeeName =
        data.approverName;

      // Cập nhật người được chọn để phê duyệt ở cấp tiếp theo (nếu có)
      if (data.nextApproverCode) {
        departmentRequest.levelApproval[currentLevelIndex].IsSelected =
          data.nextApproverCode;
      }

      // 5. Cập nhật trạng thái của yêu cầu tuyển dụng
      if (data.status === "rejected") {
        // Nếu từ chối, cập nhật trạng thái của yêu cầu thành rejected
        requestRecruitment.status = "rejected";

        // Gửi thông báo cho người tạo yêu cầu về việc từ chối
        // const notificationToCreator: INoti = {
        //   userId: requestRecruitment.createdBy.userId,
        //   title: `Yêu cầu tuyển dụng đã bị từ chối`,
        //   content: `Yêu cầu tuyển dụng của bạn đã bị từ chối bởi ${data.approverName} ở cấp ${data.level}. Lý do: ${data.reasonReject || 'Không có lý do'}`,
        //   isRead: false,
        //   type: 'approval_rejected',
        //   link: `/recruitment-requests/detail/${requestRecruitment._id}`,
        //   createdAt: new Date()
        // };

        // await this.notiService.create(notificationToCreator, sessionStart);
      } else if (data.status === "approved") {
        // Kiểm tra xem đây có phải là cấp cuối cùng không
        const maxLevel = Math.max(
          ...departmentRequest.levelApproval.map((level) => level.level || 0)
        );
        const isLastLevel = data.level === maxLevel;

        if (isLastLevel) {
          // Nếu là cấp cuối cùng, cập nhật trạng thái thành completed
          requestRecruitment.status = "approved";

          // // Gửi thông báo cho người tạo yêu cầu về việc hoàn thành
          // const notificationToCreator: INoti = {
          //   userId: requestRecruitment.createdBy.userId,
          //   title: `Yêu cầu tuyển dụng đã được phê duyệt hoàn tất`,
          //   content: `Yêu cầu tuyển dụng của bạn đã được phê duyệt hoàn tất bởi ${data.approverName} ở cấp cuối cùng. Yêu cầu đã sẵn sàng để thực hiện.`,
          //   isRead: false,
          //   type: 'approval_completed',
          //   link: `/recruitment-requests/detail/${requestRecruitment._id}`,
          //   createdAt: new Date()
          // };

          // await this.notiService.create(notificationToCreator, sessionStart);
        } else {
          // Nếu không phải cấp cuối cùng, cập nhật trạng thái thành pending
          requestRecruitment.status = "pending";

          // Tìm cấp phê duyệt tiếp theo
          const nextLevel = data.level + 1;
          const nextLevelIndex = departmentRequest.levelApproval.findIndex(
            (level) => level.level === nextLevel
          );

          if (nextLevelIndex !== -1) {
            // Nếu người phê duyệt hiện tại đã chọn người phê duyệt tiếp theo
            if (data.nextApproverCode && data.nextApproverName) {
              // Cập nhật thông tin người phê duyệt cho cấp tiếp theo
              departmentRequest.levelApproval[nextLevelIndex].EmployeeId =
                data.nextApproverCode;
              departmentRequest.levelApproval[nextLevelIndex].EmployeeName =
                data.nextApproverName;

              // Gửi thông báo cho người phê duyệt được chọn
              // const notificationToNextApprover: INoti = {
              //   userId: data.nextApproverCode,
              //   title: `Yêu cầu tuyển dụng cần phê duyệt`,
              //   content: `Bạn đã được ${data.approverName} chọn để phê duyệt yêu cầu tuyển dụng từ ${requestRecruitment.createdBy.RequesterName || 'Người dùng'} ở cấp ${nextLevel}.`,
              //   isRead: false,
              //   type: 'approval_assigned',
              //   link: `/recruitment-requests/detail/${requestRecruitment._id}`,
              //   createdAt: new Date()
              // };

              // await this.notiService.create(notificationToNextApprover, sessionStart);
            }
            // Nếu cấp trước đã chọn người phê duyệt (thông qua IsSelected)
            else if (
              departmentRequest.levelApproval[currentLevelIndex].IsSelected
            ) {
              const selectedApproverCode =
                departmentRequest.levelApproval[currentLevelIndex].IsSelected;

              // Cập nhật thông tin người được chọn cho cấp tiếp theo
              departmentRequest.levelApproval[nextLevelIndex].EmployeeId =
                selectedApproverCode;
              // Có thể cần API riêng để lấy tên từ mã nhân viên

              // Gửi thông báo cho người phê duyệt đã được chọn từ trước
              // const notificationToSelectedApprover: INoti = {
              //   userId: selectedApproverCode,
              //   title: `Yêu cầu tuyển dụng cần phê duyệt`,
              //   content: `Bạn đã được chọn để phê duyệt yêu cầu tuyển dụng từ ${requestRecruitment.createdBy.RequesterName || 'Người dùng'} ở cấp ${nextLevel}.`,
              //   isRead: false,
              //   type: 'approval_assigned',
              //   link: `/recruitment-requests/detail/${requestRecruitment._id}`,
              //   createdAt: new Date()
              // };

              // await this.notiService.create(notificationToSelectedApprover, sessionStart);
            }
          }

          // Gửi thông báo cho người tạo yêu cầu về tiến độ phê duyệt
          // const notificationToCreator: INoti = {
          //   userId: requestRecruitment.createdBy.userId,
          //   title: `Yêu cầu tuyển dụng đã được phê duyệt ở cấp ${data.level}`,
          //   content: `Yêu cầu tuyển dụng của bạn đã được phê duyệt bởi ${data.approverName} ở cấp ${data.level} và đang chờ phê duyệt ở cấp tiếp theo.`,
          //   isRead: false,
          //   type: 'approval_progress',
          //   link: `/recruitment-requests/detail/${requestRecruitment._id}`,
          //   createdAt: new Date()
          // };

          // await this.notiService.create(notificationToCreator, sessionStart);
        }
      }

      // 6. Lưu các thay đổi
      await requestRecruitment.save({ session: sessionStart });
      await departmentRequest.save({ session: sessionStart });

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

      // Commit transaction
      await this.uow.commit();

      // Trả về kết quả
      return response.status(200).json({
        status: 200,
        message: `Yêu cầu tuyển dụng đã được ${data.status === "approved" ? "phê duyệt" : "từ chối"} thành công`,
        data: {
          requestId: requestRecruitment._id,
          status: requestRecruitment.status,
          approvalLevel: data.level,
          approvalStatus: data.status,
          isLastLevel:
            data.level ===
            Math.max(
              ...departmentRequest.levelApproval.map(
                (level) => level.level || 0
              )
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
        message: "Đã xảy ra lỗi khi phê duyệt yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }

  @Get("/department/approval-history/:requestId")
  @HttpCode(200)
  async getApprovalHistory(@Req() req: Request, @Res() response: Response) {
    try {
      const { requestId } = req.params;

      // Lấy lịch sử phê duyệt
      const approvalHistory = await ApprovalHistory.find({ requestId }).sort({
        level: 1,
        approvedAt: -1,
      });

      return response.status(200).json({
        status: 200,
        message: "Lấy lịch sử phê duyệt thành công",
        data: approvalHistory,
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy lịch sử phê duyệt",
        error: error.message,
      });
    }
  }

  @Get("/department/pending-approvals/:approverId")
  @HttpCode(200)
  async getPendingApprovals(@Req() req: Request, @Res() response: Response) {
    try {
      const { approverId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Tìm các yêu cầu đang chờ phê duyệt cho người phê duyệt cụ thể
      const departmentRequests = await DepartmentRecruitmentRequest.find({
        levelApproval: {
          $elemMatch: {
            EmployeeId: approverId,
            status: null, // Chưa được phê duyệt
          },
        },
      })
        .populate("requestId")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ "additionalInfo.createdAt": -1 });

      // Đếm tổng số yêu cầu
      const totalDocs = await DepartmentRecruitmentRequest.countDocuments({
        levelApproval: {
          $elemMatch: {
            EmployeeId: approverId,
            status: null,
          },
        },
      });

      // Biến đổi dữ liệu trước khi trả về
      const optimizedData = departmentRequests.map((doc) => {
        const { _id, requestId, total, levelApproval } = doc;
        const requestIdObj = requestId as any; // Type assertion để tránh lỗi TypeScript

        // Tìm cấp phê duyệt của người dùng hiện tại
        const userApprovalLevel = levelApproval.find(
          (level) => level.EmployeeId === approverId && level.status === null
        );

        return {
          _id,
          requestId: requestIdObj?._id,
          requestInfo: {
            formType: requestIdObj?.formType,
            status: requestIdObj?.status,
            requesterName: requestIdObj?.createdBy?.RequesterName,
            requesterCode: requestIdObj?.createdBy?.RequesterCode,
            formTitle: requestIdObj?.nameForm?.title,
            createdAt: requestIdObj?.createdAt,
          },
          total,
          approvalLevel: userApprovalLevel?.level || 0,
          createdAt: doc.additionalInfo?.createdAt,
        };
      });

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu chờ phê duyệt thành công",
        data: optimizedData,
        pagination: {
          totalDocs,
          limit,
          totalPages: Math.ceil(totalDocs / limit),
          page,
          hasPrevPage: page > 1,
          hasNextPage: page < Math.ceil(totalDocs / limit),
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page < Math.ceil(totalDocs / limit) ? page + 1 : null,
        },
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy danh sách yêu cầu chờ phê duyệt",
        error: error.message,
      });
    }
  }

  @Post("/department/revise/:id")
  @HttpCode(200)
  async reviseRequestRecruitment(
    @Param("id") id: string,
    @Body() data: IRecruitmentRequest,
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

      // 2. Kiểm tra yêu cầu tuyển dụng phòng ban có tồn tại không
      const existingDepartmentRequest =
        await DepartmentRecruitmentRequest.findOne({ requestId: id });
      if (!existingDepartmentRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng phòng ban",
          data: null,
        });
      }

      // 3. Cập nhật thông tin yêu cầu tuyển dụng
      existingRequest.formType = data.formType || "YCTD";
      existingRequest.status = "pending"; // Reset về trạng thái chờ phê duyệt
      existingRequest.nameForm = data.nameForm || {
        title: "Yêu cầu tuyển dụng",
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

      // 4. Cập nhật yêu cầu phòng ban
      existingDepartmentRequest.total = data.total || 0;

      // Cập nhật hrAnswer đúng cách
      existingDepartmentRequest.hrAnswer = {
        dateOfAdoption: data.hrAnswer?.dateOfAdoption || "N/A",
        numberOfAdopt: data.hrAnswer?.numberOfAdopt || "0",
        comment: data.hrAnswer?.comment || "N/A",
      };

      // Cập nhật positions
      if (data.positions) {
        existingDepartmentRequest.positions = data.positions;
      }
      // 5. Reset levelApproval đúng cách với Mongoose
      if (data.levelApproval && data.levelApproval.length > 0) {
        // Xóa tất cả cấp phê duyệt hiện tại
        existingDepartmentRequest.levelApproval = [] as any;
        // Thêm từng cấp phê duyệt mới
        data.levelApproval.forEach((level) => {
          existingDepartmentRequest.levelApproval.push({
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

      // 6. Cập nhật thời gian
      if (!existingDepartmentRequest.additionalInfo) {
        existingDepartmentRequest.additionalInfo = {};
      }
      existingDepartmentRequest.additionalInfo.createdAt =
        existingDepartmentRequest.additionalInfo.createdAt || new Date();
      existingDepartmentRequest.additionalInfo.updatedAt = new Date();

      // 7. Lưu thay đổi
      await existingRequest.save({ session: sessionStart });
      await existingDepartmentRequest.save({ session: sessionStart });

      // 8. Xóa tất cả lịch sử phê duyệt cũ
      await ApprovalHistory.deleteMany(
        { requestId: id },
        { session: sessionStart }
      );

      // 9. Tạo lịch sử phê duyệt mới cho cấp đầu tiên (nếu có)
      if (data.levelApproval && data.levelApproval.length > 0) {
        const firstLevel = data.levelApproval[0];
        const approvalHistoryData = {
          requestId: id,
          approvedBy: {
            userId:
              firstLevel.codeUserApproval || firstLevel.EmployeeId || "N/A",
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
        message: "Yêu cầu tuyển dụng đã được làm mới thành công",
        data: {
          requestId: existingRequest._id,
          departmentRequestId: existingDepartmentRequest._id,
          status: existingRequest.status,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi làm mới yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }

  @Put("/department/edit/:id")
  @HttpCode(200)
  async editRequestRecruitment(
    @Param("id") id: string,
    @Body() data: Partial<IRecruitmentRequest>,
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

      // 2. Kiểm tra yêu cầu tuyển dụng phòng ban có tồn tại không
      const existingDepartmentRequest =
        await DepartmentRecruitmentRequest.findOne({ requestId: id });
      if (!existingDepartmentRequest) {
        return response.status(404).json({
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng phòng ban",
          data: null,
        });
      }

      // 3. Kiểm tra trạng thái - chỉ cho phép sửa nếu yêu cầu chưa được phê duyệt hoàn tất hoặc từ chối
      if (existingRequest.status !== "pending") {
        return response.status(400).json({
          status: 400,
          message:
            "Không thể sửa yêu cầu đã được phê duyệt hoàn tất hoặc đã bị từ chối",
          data: null,
        });
      }

      // 4. Cập nhật thông tin yêu cầu tuyển dụng (nếu có)
      if (data.formType) existingRequest.formType = data.formType;
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

      // 5. Cập nhật yêu cầu phòng ban (nếu có)
      if (data.total !== undefined)
        existingDepartmentRequest.total = data.total;

      if (data.hrAnswer) {
        // Kiểm tra và gán giá trị an toàn
        const currentDateOfAdoption =
          existingDepartmentRequest.hrAnswer?.dateOfAdoption || "N/A";
        const currentNumberOfAdopt =
          existingDepartmentRequest.hrAnswer?.numberOfAdopt || "0";
        const currentComment =
          existingDepartmentRequest.hrAnswer?.comment || "N/A";

        existingDepartmentRequest.hrAnswer = {
          dateOfAdoption: data.hrAnswer.dateOfAdoption || currentDateOfAdoption,
          numberOfAdopt: data.hrAnswer.numberOfAdopt || currentNumberOfAdopt,
          comment: data.hrAnswer.comment || currentComment,
        };
      }

      if (data.positions) existingDepartmentRequest.positions = data.positions;

      // 6. Cập nhật thời gian
      if (!existingDepartmentRequest.additionalInfo) {
        existingDepartmentRequest.additionalInfo = {};
      }
      existingDepartmentRequest.additionalInfo.createdAt =
        existingDepartmentRequest.additionalInfo.createdAt || new Date();
      existingDepartmentRequest.additionalInfo.updatedAt = new Date();

      // 7. Lưu thay đổi
      await existingRequest.save({ session: sessionStart });
      await existingDepartmentRequest.save({ session: sessionStart });

      // 8. Tạo bản ghi lịch sử cho việc chỉnh sửa
      const editHistoryData = {
        requestId: id,
        approvedBy: {
          userId: "system",
          name: "Hệ thống",
          code: "SYSTEM",
        },
        level: 0,
        status: "edit",
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
        message: "Yêu cầu tuyển dụng đã được cập nhật thành công",
        data: {
          requestId: existingRequest._id,
          departmentRequestId: existingDepartmentRequest._id,
          status: existingRequest.status,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback();

      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi cập nhật yêu cầu tuyển dụng",
        error: error.message,
      });
    }
  }

  @Get("/department/user/:userId")
  @HttpCode(200)
  async getUserRequests(
    @Param("userId") userId: string,
    @Req() req: Request,
    @Res() response: Response
  ) {
    try {
      // Lấy các tham số phân trang và lọc
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";
      const formType = req.query.formType as string || "all";
      // Xây dựng filter - lấy trực tiếp từ model yêu cầu tuyển dụng
      const filter: any = {
        "createdBy.userId": userId,
      };

      // Thêm các điều kiện lọc khác
      if (status && status !== "all") {
        filter.status = status;
      }

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (formType && formType !== "all") {
        filter.formType = formType;
      }

      // Xây dựng options cho phân trang
      const sortOption: any = {};
      sortOption[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Thực hiện query với phân trang
      const result = await (RequestRecruitment as any).paginate(filter, {
        page,
        limit,
        sort: sortOption,
      });

      // Nếu không tìm thấy yêu cầu nào, trả về mảng rỗng
      if (!result.docs || result.docs.length === 0) {
        return response.status(200).json({
          status: 200,
          message: "Không tìm thấy yêu cầu tuyển dụng cho người dùng này",
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

      // Tìm thông tin chi tiết từ DepartmentRecruitmentRequest
      const departmentRequests = await DepartmentRecruitmentRequest.find({
        requestId: { $in: requestIds },
      });

      // Tạo map để dễ dàng truy xuất thông tin chi tiết
      const departmentRequestMap = new Map();
      departmentRequests.forEach((dept) => {
        departmentRequestMap.set(dept.requestId.toString(), dept);
      });

      // Biến đổi dữ liệu trước khi trả về
      const transformedData = result.docs.map((req: any) => {
        const deptRequest = departmentRequestMap.get(req._id.toString());

        return {
          _id: req._id,
          requestId: req._id,
          formType: req.formType,
          nameForm: req.nameForm,
          status: req.status,
          createdBy: req.createdBy,
          total: deptRequest?.total || 0,
          positions: deptRequest?.positions || [],
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          // Thông tin phê duyệt hiện tại nếu có
          currentApprovalInfo:
            deptRequest?.levelApproval && deptRequest.levelApproval.length > 0
              ? deptRequest.levelApproval.find(
                  (level: any) => level.status === "pending"
                ) ||
                deptRequest.levelApproval[deptRequest.levelApproval.length - 1]
              : null,
        };
      });

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách yêu cầu tuyển dụng của người dùng thành công",
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
      console.error("Error in getUserRequests:", error);
      return response.status(500).json({
        status: 500,
        message:
          "Đã xảy ra lỗi khi lấy danh sách yêu cầu tuyển dụng của người dùng",
        error: error.message,
      });
    }
  }
  @Put("/update-processing/:id")
  @HttpCode(200)
  async updateProcessing(@Param("id") id: string, @Body() data: any, @Res() response: Response) {
    try {
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {  
        throw new Error("Session failed to start");
      }
      const existingRequest = await RequestRecruitment.findById(id);
      if (!existingRequest) {
        return response.status(404).json({  
          status: 404,
          message: "Không tìm thấy yêu cầu tuyển dụng",
          data: null,
        });
      }
      if(data.processing) existingRequest.processing = data.processing; 
      await existingRequest.save({ session: sessionStart });
      await this.uow.commit();
      return response.status(200).json({
        status: 200,  
        message: "Cập nhật trạng thái xử lý thành công",
        data: existingRequest,
      });
    } catch (error: any) {
      console.error("Error in updateProcessing:", error);
      await this.uow.rollback();  
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi cập nhật trạng thái xử lý",
        error: error.message,
      });
    }
  }
}

export default RequestRecruitmentController;
