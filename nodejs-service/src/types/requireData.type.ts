import { Document } from "mongoose";

export interface IRequireData extends Document {
  name: string;
  value: string;
  type: string;
}
