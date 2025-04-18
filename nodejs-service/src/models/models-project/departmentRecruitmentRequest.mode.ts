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
    typeRecruit: {
      isSelectInternal: { type: Boolean },
      isSelectExternal: { type: Boolean },
      fromDateInternal : { type: Date },
      toDateInternal : { type: Date },
      fromDateExternal : { type: Date },
      toDateExternal : { type: Date },
    },
    numberOfAdopt: { type: String },
    comment: { type: String },
  },
  positions: { type: Array },
  isSpecial: { type: Boolean, default: false },
  countSpecial: { type: Number, default: 0 },
  infoDepartment: {
    division: { type: String },
    department: { type: String },
    fiscalYear: { type: String },
    month: { type: String },
    dOrNonD: { type: String },
  },
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
