import { Document } from "mongoose";

export interface ILogger extends Document {
  code: string;
  logType: string;
  content: string;
  ipAddress: string;
}
