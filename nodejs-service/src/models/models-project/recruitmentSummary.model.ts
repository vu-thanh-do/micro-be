import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
interface IRecruitmentSummary {
  departmentId: number; // Ref đến CompanyStructure._id
  year: number; // Năm tài chính
  month: number; // 1 -> 12
  adjust: number; // Số tuyển thêm thủ công
  note?: string; // Ghi chú nếu có
  createdAt?: Date;
  updatedAt?: Date;
}
const RecruitmentSummarySchema = new mongoose.Schema<IRecruitmentSummary>(
  {
    departmentId: { type: Number, required: true, ref: "CompanyStructure" },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    adjust: { type: Number, required: true, default: 0 },
    note: { type: String },
  },
  { timestamps: true, versionKey: false }
);

RecruitmentSummarySchema.plugin(mongoosePaginate);
interface IRecruitmentSummaryModel extends mongoose.PaginateModel<IRecruitmentSummary> {}
const RecruitmentSummary = mongoose.model<IRecruitmentSummary, IRecruitmentSummaryModel>(
  "RecruitmentSummary",
  RecruitmentSummarySchema
);
export default RecruitmentSummary;
export type RecruitmentSummaryDocument = mongoose.PaginateModel<typeof RecruitmentSummarySchema>;
