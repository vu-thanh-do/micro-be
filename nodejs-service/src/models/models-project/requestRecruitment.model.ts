import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const requestSchema = new mongoose.Schema({
  formType: { type: String, required: true },  // Tên form, ví dụ: 'MFGNEW , YCTD'
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' },
  createdBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    RequesterName: { type: String, required: true },
    RequesterCode: { type: String, required: true },
    RequesterPosition: { type: String, required: true },
    RequesterSection: { type: String, required: true },
  },
  processing: { type: String },
  nameForm: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
requestSchema.plugin(mongoosePaginate);
const RequestRecruitment = mongoose.model("RequestRecruitment", requestSchema);

export default RequestRecruitment;

