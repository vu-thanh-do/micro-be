import mongoose, { Model, PaginateModel } from "mongoose";
import { INoti } from "../../types/noti.type";
import { ILogger } from "../../types/logs.type";
import mongoosePaginate from "mongoose-paginate-v2";
export interface ILogs extends Document {
  action: string;
  description: string;
  userId: string;
  createdAt: Date;
}
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
interface LogsModel<T extends Document> extends PaginateModel<T> {}
const Logs = mongoose.model<ILogs, LogsModel<ILogs>>('Logs', LogsSchema);
export default Logs;
