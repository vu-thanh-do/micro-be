import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const AdoptionDetailSchema = new mongoose.Schema(
  {
    adoptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Adoption",
      required: true,
    },
    batchNumber: { type: String },
    quantity: { type: Number },
    detailEmployees: [
      {
        name: { type: String },
        sex: { type: String },
        dob: { type: Date },
        address: { type: String },
        interviewResult: { type: String },
        healthResult: { type: String },
        adoptResult: { type: String },
        employeeCode: { type: String },
        section: { type: String },
        group: { type: String },
        team: { type: String },
        workingGroup: { type: String },
        position: { type: String },
        grade: { type: String },
        entryDate: { type: Date },
        base: { type: Number },
        ges: { type: Number },
        pfm: { type: Number },
        specialAdj: { type: Number },
        remark: { type: String },
      },
    ],
    type: { type: String }, // direct or indirect
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "completed"],
      default: "pending"
    },
    levelApproval: [
      {
        Id: { type: Number },
        level: { type: Number },
        status: {
          type: String,
      enum: ["pending", "approved", "rejected", "processing", "completed"],
      default: "pending"
        },
        reasonReject: { type: String },
        approveTime: { type: String },
        codeUserApproval: { type: String },
        EmployeeId: { type: String },
        EmployeeName: { type: String },
        IsSelected: { type: String },
      },
    ],
    hrResponse: {
      totalOfRecruitment: { type: String },
      hrResponse: [
        {
          entryDate: { type: Date },
          no: { type: Number },
          date: { type: Date },
          passHealth: { type: String },
          adopted: { type: String },
          actualComing: { type: String },
        },
      ],
      balanceNo: { type: Number },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AdoptionDetailSchema.plugin(mongoosePaginate);
const AdoptionDetail = mongoose.model("AdoptionDetail", AdoptionDetailSchema);
export default AdoptionDetail;
