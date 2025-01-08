import mongoose, { Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IRequireData } from "../../types/requireData.type";

const RequireDataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    value: {
      type: String,
    },
    type: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
RequireDataSchema.plugin(mongoosePaginate);
const RequireData: Model<IRequireData> = mongoose.model<IRequireData>(
  "RequireData",
  RequireDataSchema
);
export default RequireData;
