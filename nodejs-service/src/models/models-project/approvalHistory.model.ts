import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ApprovalHistorySchema = new mongoose.Schema({
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestRecruitment', required: true },
    approvedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      code: { type: String, required: true },
    },
    level: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
    approvedAt: { type: Date, default: Date.now },
    reasonReject: { type: String }
});

ApprovalHistorySchema.plugin(mongoosePaginate);

const ApprovalHistory = mongoose.model("ApprovalHistory", ApprovalHistorySchema);

export default ApprovalHistory;

