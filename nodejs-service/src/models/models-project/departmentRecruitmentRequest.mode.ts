import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const DepartmentRecruitmentRequestSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RequestRecruitment",
    required: true,
  },
  total: { type: Number },
  hrAnswer: {
    dateOfAdoption: { type: String },
    numberOfAdopt: { type: String },
    comment: { type: String },
  },
  positions: { type: Array },

  levelApproval: [
    {
      Id: { type: Number },
      level: { type: Number },
      status: { type: String },
      reasonReject: { type: String },
      approveTime: { type: String },
      codeUserApproval: { type: String },
      EmployeeId: { type: String },
      EmployeeName: { type: String },
      IsSelected: { type: String },
    },
  ],
  additionalInfo: { type: Object },
});

DepartmentRecruitmentRequestSchema.plugin(mongoosePaginate);

const DepartmentRecruitmentRequest = mongoose.model(
  "DepartmentRecruitmentRequest",
  DepartmentRecruitmentRequestSchema
);

export default DepartmentRecruitmentRequest;
