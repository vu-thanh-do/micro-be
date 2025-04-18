import { injectable } from "inversify";
import mongoose from "mongoose";
import ApprovalHistory, { IApprovalHistoryModel } from "../../models/models-project/approvalHistory.model";

@injectable()
export class HistoryApprovalService {
  private readonly model: IApprovalHistoryModel;

  constructor() {
    this.model = ApprovalHistory;
  }

  async getUserApprovalHistory(
    userId: string,
    status: "approved" | "rejected",
    recCode?: string,
    requestStatus?: string,
    fromDate?: Date,
    toDate?: Date,
    page = 1,
    limit = 10
  ) {
    const query: any = {
      "approvedBy.userId": userId,
      status,
    };

    if (fromDate || toDate) {
      query.approvedAt = {};
      if (fromDate) query.approvedAt.$gte = fromDate;
      if (toDate) query.approvedAt.$lte = toDate;
    }

    const rawResult = await this.model.find(query)
      .populate("requestId")
      .sort({ approvedAt: -1 });

    // Lọc nếu cần theo dữ liệu populate
    const filtered = rawResult.filter((doc: any) => {
      if (!doc.requestId) return false;
      if (recCode && doc.requestId.recCode !== recCode) return false;
      if (requestStatus && doc.requestId.status !== requestStatus) return false;
      return true;
    });

    // Manual pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    return {
      docs: paginated,
      totalDocs: filtered.length,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
      page,
      pagingCounter: start + 1,
      hasPrevPage: page > 1,
      hasNextPage: end < filtered.length,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: end < filtered.length ? page + 1 : null,
    };
  }
}