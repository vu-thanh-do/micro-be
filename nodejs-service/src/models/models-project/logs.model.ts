import mongoose, { Model } from "mongoose";
import { INoti } from "../../types/noti.type";
import { ILogger } from "../../types/logs.type";
import mongoosePaginate from "mongoose-paginate-v2";

const LogsSchema = new mongoose.Schema(
  {
    code: String,
    logType: String,
    content: String,
    ipAddress: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
LogsSchema.plugin(mongoosePaginate);
const Logs: Model<ILogger> = mongoose.model<ILogger>("Logs", LogsSchema);

export default Logs;
