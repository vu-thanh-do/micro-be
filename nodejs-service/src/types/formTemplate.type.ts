import { Document } from "mongoose";

export interface IFormTemplateV2 extends Document {
  nameForm: String;
  typeForm: String;
  fields: any[];
  codeApproval: String[];
  status: String;
  version: String;
  dateApply:Date
}
import mongoose from "mongoose";


// types/formTemplate.type.ts
export interface ISpecificCodeApprove {
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
}

export interface IExcludeCodeApprove {
  employeeCode: string;
}
  
export interface ICodeApprovalItem {
  _idCodeApproval: mongoose.Types.ObjectId;
  status: string;
  indexSTT: number;
  specificCodeApprove: ISpecificCodeApprove[];
  excludeCodeApprove: IExcludeCodeApprove[];
}

export interface IFormTemplate extends Document {
  nameForm: Object;
  typeForm: string;
  version: string;
  dateApply: Date;
  fields: any[];
  codeApproval: ICodeApprovalItem[];
  status: string;
}