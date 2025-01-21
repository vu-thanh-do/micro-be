import mongoose, { Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ICodeApproval } from "../../types/codeApproval.type";
const CodeApprovalSchema = new mongoose.Schema(
  {
    label: {
      type: String,
    },
    code: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
    },
    index: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
CodeApprovalSchema.plugin(mongoosePaginate);
const CodeApproval : Model<ICodeApproval>  = mongoose.model<ICodeApproval>("CodeApproval", CodeApprovalSchema);
export default CodeApproval;
