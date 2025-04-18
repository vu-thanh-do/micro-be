import mongoose, { PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
interface IAdoption extends Document {
  recCode: string;
  requestRecruitment: mongoose.Types.ObjectId;
  createdBy: {
    userId: string;
    name: string;
    RequesterName: string;
    RequesterCode: string;
    RequesterPosition: string;
  };
  memberHrCreate: {
    userId: string;
    name: string;
    CreateByName: string;
    CreateByCode: string;
    CreateByPosition: string;
  };
  type: string;
  status: "pending" | "approved" | "rejected" | "processing" | "completed";
  remark: string;
}
const AdoptionSchema = new mongoose.Schema(
  {
    recCode: { type: String },
    requestRecruitment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RequestRecruitment",
    },
    createdBy: {
      userId: { type: String, default: "" },
      name: { type: String, default: "" },
      RequesterName: { type: String, default: "" },
      RequesterCode: { type: String, default: "" },
      RequesterPosition: { type: String, default: "" },
    },
    memberHrCreate: {
      userId: { type: String, default: "" },
      name: { type: String, default: "" },
      CreateByName: { type: String, default: "" },
      CreateByCode: { type: String, default: "" },
      CreateByPosition: { type: String, default: "" },
    },
    type: { type: String }, // direct / indirect
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing", "completed"],
      default: "pending"
    },
    remark: { type: String },
  },
  { timestamps: true, versionKey: false }
);

AdoptionSchema.plugin(mongoosePaginate);
interface AdoptionModel<T extends Document> extends PaginateModel<T> {}
const Adoption = mongoose.model<IAdoption, AdoptionModel<IAdoption>>(
  "Adoption",
  AdoptionSchema
);
export default Adoption;
