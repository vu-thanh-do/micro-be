import { injectable } from "inversify";
import PendingApproval, {
  IPendingApproval,
  IPendingApprovalModel,
} from "../../models/models-project/pendingApproval.model";
import mongoose from "mongoose";

@injectable()
export class PendingApprovalService {
  private readonly model: IPendingApprovalModel;

  constructor() {
    this.model = PendingApproval;
  }

  async getAllForAdmin(page = 1, limit = 10) {
    return this.model.paginate(
      {},
      { page, limit, sort: { createdAt: -1 }, populate: { path: "requestId" } }
    );
  }

  async getAllForUser(userId: string, page = 1, limit = 10) {
    return this.model.paginate(
      { userId, status: "pending" },
      { page, limit, sort: { createdAt: -1 }, populate: { path: "requestId" } }
    );
  }

  async create(data: any) {
    const convertedData = {
      requestId: new mongoose.Types.ObjectId(data.requestId),
      userId: data.userId,
      userName: data.userName ?? "",
      email: data.email ?? "",
      level: data.level ?? 0,
      status: data.status ?? "pending",
      createdAt: new Date(),
    };
    return this.model.create(convertedData);
  }
  async updateStatus(
    requestId: string,
    userId: string,
    status: "approved" | "rejected"
  ) {
    return this.model.findOneAndUpdate(
      { requestId, userId },
      { status },
      { new: true }
    );
  }
}
