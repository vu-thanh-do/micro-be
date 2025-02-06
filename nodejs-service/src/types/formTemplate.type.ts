import { Document } from "mongoose";

export interface IFormTemplate extends Document {
  nameForm: String;
  typeForm: String;
  fields: any[];
  codeApproval: String[];
  status: String;
  version: String;
  dateApply:Date
}
