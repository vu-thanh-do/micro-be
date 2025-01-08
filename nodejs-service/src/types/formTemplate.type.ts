import { Document } from "mongoose";

export interface IFormTemplate extends Document {
  name: String;
  typeForm: String;
  dataForm: String[];
  approval: String[];
  status: String;
}
