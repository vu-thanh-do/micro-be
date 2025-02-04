import { Document } from "mongoose";

export interface ICodeApproval extends Document {
  label: String;
  code: String;
  status: String;
  index: Number;
}
export interface IUpdateCodeApproval extends Document {
  status: String;
}