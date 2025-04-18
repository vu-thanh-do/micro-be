import mongoose, { Document, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

// Interface cho document
export interface IPendingApproval extends Document {
  requestId: mongoose.Types.ObjectId;
  userId: string;
  userName?: string;
  email?: string;
  level?: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface IPendingApprovalModel extends PaginateModel<IPendingApproval> {}

const PendingApprovalSchema = new mongoose.Schema<IPendingApproval>(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequestRecruitment",
      required: true,
    },
    userId: { type: String, required: true },
    userName: { type: String },
    email: { type: String },
    level: { type: Number },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);
PendingApprovalSchema.plugin(mongoosePaginate);
const PendingApproval = mongoose.model<IPendingApproval, IPendingApprovalModel>(
  "PendingApproval",
  PendingApprovalSchema
);

export default PendingApproval;
