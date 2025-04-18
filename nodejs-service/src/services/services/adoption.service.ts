import { injectable } from "inversify";
import RequestRecruitment from "../../models/models-project/requestRecruitment.model";
import Adoption from "../../models/models-project/adoption.model";
import mongoose, { Model } from "mongoose";
import AdoptionDetail from "../../models/models-project/adoptionDetail.model";
import ApprovalHistory from "../../models/models-project/approvalHistory.model";
import { convertToISODate, isValidDateString } from "../../utils/utils";

interface IDataAdoptionVersionHr {
  recCode: string;
  requestRecruitment: mongoose.Types.ObjectId;
  createdBy: {
    userId: string;
    name: string;
    RequesterName: string;
    RequesterCode: string;
    RequesterPosition: string;
  };
  type: string;
  status: string;
  remark: string;
}

interface IApprovalData {
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

@injectable()
export class AdoptionService {
  constructor() {}
  async loadRecCode(recCode?: string) {
    try {
      const recCode = await RequestRecruitment.find({
        "processing.code": "HEALTHCHECK",
      });
      return recCode;
    } catch (error: any ) {
      return {
        status: 500,
        message: "Lỗi khi tải mã tuyển dụng",
        error: error.message,
      };
    }
  }
  async checkRecCode(recCode: string) {
    try {
      const checkRecCode = await Adoption.findOne({
        recCode: recCode,
      });
      if (checkRecCode) {
        return true;
      } else return false;
    } catch (error) {
      return true;
    }
  }
  async getAllRecCodeAdoption(page: number, limit: number, recCode?: string) {
    try {
      const filter: any = {
        "processing.code": "HEALTHCHECK",
      };

      if (recCode && recCode.trim() !== "") {
        filter.recCode = {
          $exists: true,
          $ne: "",
          $regex: recCode,
          $options: "i",
        };
      } else {
        // Vẫn cần field recCode tồn tại và không rỗng
        filter.recCode = {
          $exists: true,
          $ne: "",
        };
      }
      const result = await (RequestRecruitment as any).paginate(filter, {
        page: page || 1,
        limit: limit || 10,
        sort: { createdAt: -1 },
        lean: true,
        leanWithId: false,
      });

      result.docs = result.docs.map((doc: any) => ({
        ...doc,
        _id: doc._id.toString(),
      }));

      return result;
    } catch (error) {
      throw new Error("Lỗi khi lấy danh sách yêu cầu tuyển dụng");
    }
  }
  async insertDataAdoptionVersionHr(data: IDataAdoptionVersionHr) {
    try {
      const dataCreateAdotion = {
        recCode: data.recCode,
        requestRecruitment: data.requestRecruitment,
        createdBy: {
          userId: data.createdBy.userId,
          name: data.createdBy.name,
          RequesterName: data.createdBy.RequesterName,
          RequesterCode: data.createdBy.RequesterCode,
          RequesterPosition: data.createdBy.RequesterPosition,
        },
        type: data.type,
        status: data.status,
        remark: data.remark,
      };

      const adoption = await Adoption.create(dataCreateAdotion);

      return adoption;
    } catch (error) {
      return error;
    }
  }
  async getAllAdoptionAdmin(
    page: number,
    limit: number,
    type: string,
    status: string,
    recCode: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const query: any = {};
      if (type) {
        query.type = type;
      }
      if (status) {
        query.status = status;
      }
      if (recCode) {
        query.recCode = recCode;
      }
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
      if (endDate) {
        query.createdAt = { $lte: endDate };
      }
      const adoption = await Adoption.paginate(query, {
        page: page || 1,
        limit: limit || 10,
        sort: { createdAt: -1 },
        lean: true,
        leanWithId: false,
      });
      return adoption;
    } catch (error) {
      return {
        status: 500,
        message: "Lỗi khi lấy danh sách yêu cầu tuyển dụng",
        error: error,
      };
    }
  }
  async createAdoptionVersionHR(
    recCode: string,
    type: string,
    userId: string,
    name: string,
    createByName: string,
    createByCode: string,
    createByPosition: string,
    adoptionDetail: any,
    hrResponse: any
  ) {
    try {
      
      const requestRecruitment = await RequestRecruitment.findOne({ recCode });
      if (!requestRecruitment) {
        return {
          status: 400,
          message: "Mã tuyển dụng không tồn tại",
        };
      }
      const newAdoption = await Adoption.create({
        recCode,
        type,
        status :"pending",
        requestRecruitment: requestRecruitment._id,
        memberHrCreate: {
          userId,
          name,
          CreateByName: createByName,
          CreateByCode: createByCode,
          CreateByPosition: createByPosition,
        },
      });
      const newDetail = await AdoptionDetail.create({
        adoptionId: newAdoption._id,
        batchNumber: "1",
        quantity: adoptionDetail.detailEmployees.length,
        detailEmployees: adoptionDetail.detailEmployees,
        type,
        levelApproval: adoptionDetail.levelApproval || [],
        hrResponse: hrResponse,
        status :"pending"
      });
     
      return newAdoption;
    } catch (error: any) {
      return {
        status: 500,
        message: "Lỗi khi lưu adoption hoặc detail",
        error: error.message || error.toString()
      };
    }
  }
  

  async getAdoption(adoptionId: string) {
    try {
      const adoption =
        await Adoption.findById(adoptionId).populate("requestRecruitment");

      return adoption;
    } catch (error) {
      throw new Error(`Lỗi khi lấy thông tin adoption: ${error}`);
    }
  }

  async getAdoptionDetails(adoptionId: string, batchNumber?: string) {
    try {
      console.log(adoptionId,batchNumber,'batchNumber')
      // 1. Tìm adoption và tất cả các batches của nó
      const [dataAdoption, allBatches] = await Promise.all([
        Adoption.findById(adoptionId).populate("requestRecruitment"),
        AdoptionDetail.find({ adoptionId }).sort({
          batchNumber: -1,
          createdAt: -1,
        }), // Sắp xếp giảm dần theo batchNumber và createdAt
      ]);
      console.log(dataAdoption,allBatches,'allBatches')
      if (!dataAdoption) {
        return {
          status: 400,
          message: "Không tìm thấy adoption",
        };
      }

      // Kiểm tra xem có batch nào không
      if (!allBatches || allBatches.length === 0) {
        return {
          status: 400,
          message: "Không có chi tiết adoption nào",
        };
      }

      // 2. Tìm chi tiết của batch được chọn
      let selectedBatchDetail;

      if (batchNumber && batchNumber !== "latest") {
        // Nếu có chỉ định batchNumber cụ thể
        selectedBatchDetail = allBatches.find(
          (batch) => batch.batchNumber === batchNumber
        );

        if (!selectedBatchDetail) {
          return {
            status: 400,
            message: `Không tìm thấy đợt ${batchNumber}`,
          };
        }
      } else {
        // Nếu không chỉ định batchNumber hoặc yêu cầu "latest", lấy batch mới nhất
        selectedBatchDetail = allBatches[0]; // Batch đầu tiên sau khi sắp xếp giảm dần
      }

      // 3. Thêm trường batch cho mỗi nhân viên trong detailEmployees
      const detailEmployeesWithBatch = selectedBatchDetail.detailEmployees.map(
        (employee: any) => ({
          ...(employee.toObject ? employee.toObject() : employee),
          batch: parseInt(selectedBatchDetail.batchNumber),
        })
      );

      // Tạo một bản sao của selectedBatchDetail để không làm thay đổi đối tượng gốc
      const adoptionDetailsWithEmployees = {
        ...selectedBatchDetail.toObject(),
        adoptionId: dataAdoption, // Thay thế adoptionId bằng đối tượng đầy đủ
        detailEmployees: detailEmployeesWithBatch,

      };

      // 4. Format thông tin metadata của adoption
      const adoptionMetadata = {
        createdBy: dataAdoption.createdBy,
        memberHrCreate: dataAdoption.memberHrCreate,
        recCode: dataAdoption.recCode,
        type: dataAdoption.type,
        status: dataAdoption.status,
        remark: dataAdoption.remark,
      };

      // 5. Lấy thông tin của tất cả các batch
      const dateEachBatch = allBatches.map((batch) => ({
        _id: batch._id,
        batchNumber: batch.batchNumber,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        quantity: batch.quantity,
        status: batch.status,
      }));

      // 6. Cấu trúc kết quả trả về
      return {
        dataAdoption: adoptionMetadata,
        adoptionDetails: adoptionDetailsWithEmployees,
        totalBatch: allBatches.length,
        dateEachBatch: dateEachBatch,
        latestBatch: allBatches[0].batchNumber, // Thêm trường latestBatch để biết batch mới nhất là số mấy
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết adoption: ${error}`);
    }
  }

  async getAdoptionDetailById(detailId: string) {
    try {
      const adoptionDetail =
        await AdoptionDetail.findById(detailId).populate("adoptionId");

      return adoptionDetail;
    } catch (error) {
      throw new Error(`Lỗi khi lấy chi tiết adoption: ${error}`);
    }
  }

  async approveAdoptionDetail(detailId: string, approvalData: IApprovalData) {
    try {
      // 1. Kiểm tra chi tiết adoption có tồn tại không
      const adoptionDetail = await AdoptionDetail.findById(detailId);
      if (!adoptionDetail) {
        return {
          success: false,
          message: "Không tìm thấy chi tiết adoption",
          data: null,
        };
      }

      // 2. Kiểm tra cấp phê duyệt hiện tại
      const currentLevelIndex = adoptionDetail.levelApproval.findIndex(
        (level: any) => level.level === approvalData.level
      );

      if (currentLevelIndex === -1) {
        return {
          success: false,
          message: "Cấp phê duyệt không hợp lệ",
          data: null,
        };
      }

      // 3. Cập nhật trạng thái phê duyệt trong levelApproval
      adoptionDetail.levelApproval[currentLevelIndex].status =
        approvalData.status;
      adoptionDetail.levelApproval[currentLevelIndex].reasonReject =
        approvalData.reasonReject || "";
      adoptionDetail.levelApproval[currentLevelIndex].approveTime =
        new Date().toISOString();
      adoptionDetail.levelApproval[currentLevelIndex].codeUserApproval =
        approvalData.approverCode;
      adoptionDetail.levelApproval[currentLevelIndex].EmployeeId =
        approvalData.approverId;
      adoptionDetail.levelApproval[currentLevelIndex].EmployeeName =
        approvalData.approverName;

      // Cập nhật người được chọn để phê duyệt ở cấp tiếp theo (nếu có)
      if (approvalData.nextApproverCode) {
        adoptionDetail.levelApproval[currentLevelIndex].IsSelected =
          approvalData.nextApproverCode;
      }

      // 4. Cập nhật trạng thái của chi tiết adoption
      if (approvalData.status === "rejected") {
        // Nếu từ chối, cập nhật trạng thái thành rejected
        adoptionDetail.status = "rejected";
      } else if (approvalData.status === "approved") {
        // Kiểm tra xem đây có phải là cấp cuối cùng không
        const maxLevel = Math.max(
          ...adoptionDetail.levelApproval.map((level: any) => level.level || 0)
        );
        const isLastLevel = approvalData.level === maxLevel;

        if (isLastLevel) {
          // Nếu là cấp cuối cùng, cập nhật trạng thái thành approved
          adoptionDetail.status = "approved";
        } else {
          // Nếu không phải cấp cuối cùng, giữ trạng thái pending
          adoptionDetail.status = "pending";

          // Tìm cấp phê duyệt tiếp theo
          const nextLevel = approvalData.level + 1;
          const nextLevelIndex = adoptionDetail.levelApproval.findIndex(
            (level: any) => level.level === nextLevel
          );

          if (nextLevelIndex !== -1) {
            // Nếu người phê duyệt hiện tại đã chọn người phê duyệt tiếp theo
            if (
              approvalData.nextApproverCode &&
              approvalData.nextApproverName
            ) {
              // Cập nhật thông tin người phê duyệt cho cấp tiếp theo
              adoptionDetail.levelApproval[nextLevelIndex].EmployeeId =
                approvalData.nextApproverCode;
              adoptionDetail.levelApproval[nextLevelIndex].EmployeeName =
                approvalData.nextApproverName;
            }
            // Nếu cấp trước đã chọn người phê duyệt (thông qua IsSelected)
            else if (
              adoptionDetail.levelApproval[currentLevelIndex].IsSelected
            ) {
              const selectedApproverCode =
                adoptionDetail.levelApproval[currentLevelIndex].IsSelected;

              // Cập nhật thông tin người được chọn cho cấp tiếp theo
              adoptionDetail.levelApproval[nextLevelIndex].EmployeeId =
                selectedApproverCode;
            }
          }
        }
      }

      // 5. Lưu các thay đổi
      await adoptionDetail.save();

      // 6. Tạo lịch sử phê duyệt mới
      const approvalHistoryData = {
        requestId: adoptionDetail._id,
        approvedBy: {
          userId: approvalData.approverId,
          name: approvalData.approverName,
          code: approvalData.approverCode,
        },
        level: approvalData.level,
        status: approvalData.status,
        approvedAt: new Date(),
        reasonReject: approvalData.reasonReject || "",
        comment: approvalData.comment || "",
        nextApprover: approvalData.nextApproverCode
          ? {
              code: approvalData.nextApproverCode,
              name: approvalData.nextApproverName,
            }
          : undefined,
      };

      const approvalHistory = new ApprovalHistory(approvalHistoryData);
      await approvalHistory.save();

      return {
        success: true,
        message: `Yêu cầu đã được ${approvalData.status === "approved" ? "phê duyệt" : "từ chối"} thành công`,
        data: {
          detailId: adoptionDetail._id,
          adoptionId: adoptionDetail.adoptionId,
          status: adoptionDetail.status,
          approvalLevel: approvalData.level,
          approvalStatus: approvalData.status,
          isLastLevel:
            approvalData.level ===
            Math.max(
              ...adoptionDetail.levelApproval.map(
                (level: any) => level.level || 0
              )
            ),
          nextApprover: approvalData.nextApproverCode
            ? {
                code: approvalData.nextApproverCode,
                name: approvalData.nextApproverName,
              }
            : undefined,
          updatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi phê duyệt: ${error}`,
        data: null,
      };
    }
  }

  async createAdoptionBatch(adoptionId: string, batchData: any ) {
    try {
      // 1. Kiểm tra adoption có tồn tại không
      const adoption = await Adoption.findById(adoptionId);
      if (!adoption) {
        return {
          success: false,
          message: "Không tìm thấy adoption",
          data: null,
        };
      }

      // 2. Kiểm tra số batch đã tồn tại chưa
      const existingBatch = await AdoptionDetail.findOne({
        adoptionId: adoptionId,
        batchNumber: batchData.batchNumber,
      });

      if (existingBatch) {
        return {
          success: false,
          message: `Đợt ${batchData.batchNumber} đã tồn tại`,
          data: null,
        };
      }
      const hrResponse = batchData.hrResponse;
  
      // 3. Tạo chi tiết adoption mới
      const newAdoptionDetail = await AdoptionDetail.create({
        adoptionId: adoptionId,
        batchNumber: batchData.batchNumber,
        quantity: batchData.detailEmployees.length,
        detailEmployees: batchData.detailEmployees,
        type: adoption.type,
        status: "pending",
        levelApproval: batchData.levelApproval || [],
        hrResponse : hrResponse
      });

      return {
        success: true,
        message: "Tạo đợt adoption mới thành công",
        data: newAdoptionDetail,
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi tạo đợt adoption mới: ${error}`,
        data: null,
      };
    }
  }

  async getApprovalHistory(detailId: string) {
    try {
      const approvalHistory = await ApprovalHistory.find({
        requestId: detailId,
      }).sort({ level: 1, approvedAt: -1 });

      return approvalHistory;
    } catch (error) {
      throw new Error(`Lỗi khi lấy lịch sử phê duyệt: ${error}`);
    }
  }

  async updateAdoptionStatusIfAllApproved(adoptionId: string) {
    try {
      // Kiểm tra tất cả chi tiết của adoption này
      const allDetails = await AdoptionDetail.find({ adoptionId });

      // Kiểm tra xem tất cả các detail đã được phê duyệt chưa
      const allApproved = allDetails.every(
        (detail) => detail.status === "approved"
      );
      const anyRejected = allDetails.some(
        (detail) => detail.status === "rejected"
      );

      if (allApproved) {
        // Nếu tất cả đã được phê duyệt, cập nhật trạng thái adoption
        await Adoption.findByIdAndUpdate(adoptionId, { status: "approved" });
        return true;
      } else if (anyRejected) {
        // Nếu có bất kỳ chi tiết nào bị từ chối, đánh dấu adoption là có vấn đề
        await Adoption.findByIdAndUpdate(adoptionId, { status: "rejected" });
        return false;
      }

      // Trường hợp còn lại: có một số chi tiết chưa được phê duyệt
      return false;
    } catch (error) {
      console.error(`Lỗi khi cập nhật trạng thái adoption: ${error}`);
      return false;
    }
  }

  async exportDataAdoption(adoptionId: string, batchNumber: string | number) {
    try {
      // Kiểm tra adoption có tồn tại không
      const adoption =
        await Adoption.findById(adoptionId).populate("requestRecruitment");

      if (!adoption) {
        return {
          success: false,
          message: "Không tìm thấy adoption data",
          data: null,
        };
      }

      let adoptionDetails;
      let exportData: Array<any> = [];

      if (Number(batchNumber) === 0) {
        // Lấy tất cả các đợt nếu batchNumber = 0
        adoptionDetails = await AdoptionDetail.find({ adoptionId });

        // Gộp tất cả các nhân viên từ các đợt
        adoptionDetails.forEach((detail) => {
          if (detail.detailEmployees && Array.isArray(detail.detailEmployees)) {
            // Thêm thông tin batch vào mỗi nhân viên
            const employeesWithBatch = detail.detailEmployees.map(
              (employee: any) => ({
                ...(employee.toObject ? employee.toObject() : employee),
                batchNumber: detail.batchNumber,
              })
            );

            exportData = [...exportData, ...employeesWithBatch];
          }
        });
      } else {
        // Lấy chi tiết theo đợt cụ thể
        const detail = await AdoptionDetail.findOne({
          adoptionId,
          batchNumber: batchNumber.toString(),
        });

        if (!detail) {
          return {
            success: false,
            message: `Không tìm thấy đợt ${batchNumber} trong adoption`,
            data: null,
          };
        }

        // Thêm thông tin batch vào mỗi nhân viên
        if (detail.detailEmployees && Array.isArray(detail.detailEmployees)) {
          exportData = detail.detailEmployees.map((employee: any) => ({
            ...(employee.toObject ? employee.toObject() : employee),
            batchNumber: detail.batchNumber,
          }));
        }
      }

      // Format dữ liệu để export
      const formattedData = exportData.map((employee, index) => {
        return {
          STT: index + 1,
          "Họ tên": employee.name || "",
          "Mã nhân viên": employee.employeeCode || "",
          "Lương cơ bản": employee.base || 0,
          "Lương GES": employee.ges || 0,
          "Lương PPI": employee.pfm || 0,
          "Phụ cấp đặc biệt": employee.specialAdj || 0,
          "Ghi chú": employee.remark || "",
          Đợt: employee.batchNumber || "",
        };
      });

      // Lấy ngày tạo dạng string
      const createdAtStr =
        adoption && (adoption as any).createdAt
          ? new Date((adoption as any).createdAt).toLocaleDateString("vi-VN")
          : new Date().toLocaleDateString("vi-VN");

      // Thêm thông tin hiển thị ở đầu file Excel (metadata)
      const metadata = [
        {
          "Mã tuyển dụng": adoption.recCode || "",
          Loại: adoption.type || "",
          "Ngày tạo": createdAtStr,
          "Trạng thái": adoption.status || "",
          "Ghi chú": adoption.remark || "",
          "Số lượng nhân viên": exportData.length,
        },
      ];

      return {
        success: true,
        message: "Xuất dữ liệu adoption thành công",
        data: {
          metadata,
          employees: formattedData,
          filename: `Adoption_${adoption.recCode}_${batchNumber === "0" ? "All" : "Batch_" + batchNumber}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi xuất dữ liệu adoption: ${error}`,
        data: null,
      };
    }
  }
  async checkRequestRecruitAndAdoptionUser (){
    try {
      
    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi xuất dữ liệu adoption: ${error}`,
        data: null,
      };
    }
  }

  async getAllAdoptionUser(
    userId: string,
    options: {
      page: number;
      limit: number;
      search: string;
      startDate: string;
      endDate: string;
      type: string;
      status: string;
    }
  ) {
    try {
      // Tìm tất cả RequestRecruitment của user
      const requestRecruitments = await RequestRecruitment.find({
        "createdBy.userId": userId
      }).select("_id");

      const requestIds = requestRecruitments.map(req => req._id);

      // Xây dựng query cho Adoption
      const query: any = {
        requestRecruitment: { $in: requestIds }
      };

      // Thêm điều kiện tìm kiếm theo recCode
      if (options.search) {
        query.recCode = { $regex: options.search, $options: "i" };
      }

      // Thêm điều kiện lọc theo type
      if (options.type) {
        query.type = options.type;
      }

      // Thêm điều kiện lọc theo status
      if (options.status) {
        query.status = options.status;
      }

      // Thêm điều kiện lọc theo date
      if (options.startDate && options.endDate) {
        query.createdAt = {
          $gte: new Date(options.startDate),
          $lte: new Date(options.endDate)
        };
      }

      // Thực hiện query với phân trang
      const result = await Adoption.paginate(query, {
        page: options.page,
        limit: options.limit,
        sort: { createdAt: -1 },
        populate: [
          {
            path: "requestRecruitment",
            select: "formType status createdBy processing nameForm"
          }
        ]
      });

      return {
        success: true,
        message: "Lấy danh sách adoption thành công",
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi lấy danh sách adoption: ${error}`,
        data: null
      };
    }
  }
}
