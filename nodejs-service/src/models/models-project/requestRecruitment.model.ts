import mongoose, { Document, PaginateDocument, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
interface IRequestRecruitment extends Document {
  formType: string;
  status: string;
  createdBy: {
    userId: string;
    name: string;
    RequesterName: string;
    RequesterCode: string;
    RequesterPosition: string;
    RequesterSection: string;
  };
  processing: {
    code: string;
    title: string;
  };
  nameForm: {
    title : string;
  };
  createdAt: Date;
  updatedAt: Date;
  deptCode: string;
  recCode: string;
}
const requestSchema = new mongoose.Schema({
  formType: { type: String, required: true }, // Tên form, ví dụ: 'MFGNEW , YCTD'
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "draft",
  },
  createdBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    RequesterName: { type: String, required: true },
    RequesterCode: { type: String, required: true },
    RequesterPosition: { type: String, required: true },
    RequesterSection: { type: String, required: true },
  },
  processing: {
    code: { type: String },
    title: { type: String },
  },
  nameForm: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deptCode: { type: String },
  recCode: { type: String },
});
requestSchema.plugin(mongoosePaginate); 
interface IRequestRecruitmentPaginate<T extends Document> extends PaginateModel<T> {}
const RequestRecruitment = mongoose.model<IRequestRecruitment, IRequestRecruitmentPaginate<IRequestRecruitment>>(
  "RequestRecruitment",
  requestSchema
);

export default RequestRecruitment;
