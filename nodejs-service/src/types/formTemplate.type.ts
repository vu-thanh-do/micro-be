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
  _id?: string;
  employeeCode: string;
  employeeName?: string;
  employeeEmail?: string;
  deptId?: string;
  deptName?: string;
}

export interface IExcludeCodeApprove {
  _id?: string;
  employeeCode: string;
  employeeName?: string;
  employeeEmail?: string;
  deptId?: string;
  deptName?: string;
}
  
export interface ICodeApprovalItem {
  _idCodeApproval: mongoose.Types.ObjectId;
  status: string;
  indexSTT: number;
  pic?: {
    employeeCode: string;
    employeeName: string;
    employeeEmail: string;
  };
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