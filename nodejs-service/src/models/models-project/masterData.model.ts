import mongoose, { Model } from "mongoose";
import { INoti } from "../../types/noti.type";
import mongoosePaginate from "mongoose-paginate-v2";
import { IMasterData } from "../../types/masterData.type";

const MasterDataSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: Object },
    description: { type: Object },
    data: { type: Object },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
MasterDataSchema.plugin(mongoosePaginate);
const MasterData: Model<IMasterData> = mongoose.model<IMasterData>(
  "MasterData",
  MasterDataSchema
);
export default MasterData;
