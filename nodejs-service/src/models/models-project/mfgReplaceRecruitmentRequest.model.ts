import mongoose, { Model, PaginateModel } from "mongoose";
import { INoti } from "../../types/noti.type";
import mongoosePaginate from "mongoose-paginate-v2";
import { IMasterData } from "../../types/masterData.type";
import { ILanguage } from "../../types/language.type";
import { ObjectId } from "mongodb";

interface IMfgReplaceRecruitmentRequest extends Document {
  requestId: ObjectId;
  year: number;
  month: number;
  recCode: number;
  division: string;
  department: string;
  position: string;
  grade: string;
  quantity: number;
  status: boolean;
  replacement: {
    code: string;
    name: string;
    division: string;
    section: string;
    position: string;
    grade: string;
    entryDate: Date;
    actualLeaveDate: Date;
    note: string;
  }[];
  levelApproval: {
    Id: number;
    level: number;
    status: string;
    reasonReject: string;
    approveTime: string;
    codeUserApproval: string;
    EmployeeId: string;
    EmployeeName: string;
    IsSelected: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MfgReplaceRecruitmentRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequestRecruitment",
      required: true,
    },
    year: Number,
    month: Number,
    recCode: Number,
    division: String,
    department: String,
    position: String,
    grade: String,
    quantity: Number,
    status: Boolean,
    replacement: [
      {
        code: String,
        name: String,
        division: String,
        section: String,
        position: String,
        grade: String,
        entryDate: Date,
        actualLeaveDate: Date,
        note: String,
      },
    ],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
MfgReplaceRecruitmentRequestSchema.plugin(mongoosePaginate);
interface MfgReplaceRecruitmentRequestModel<T extends Document>
  extends PaginateModel<T> {}
const MfgReplaceRecruitmentRequest = mongoose.model<
  IMfgReplaceRecruitmentRequest,
  MfgReplaceRecruitmentRequestModel<IMfgReplaceRecruitmentRequest>
>("MfgReplaceRecruitmentRequest", MfgReplaceRecruitmentRequestSchema);

export default MfgReplaceRecruitmentRequest;
