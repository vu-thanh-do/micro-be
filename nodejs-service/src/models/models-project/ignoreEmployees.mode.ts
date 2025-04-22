import mongoose, { Document, Schema, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

export interface IIgnoreEmployees extends Document {
  code: string;
  name: string;
  division: string;
  section: string;
  position: string;
  grade: string;
  entryDate: Date;
  actualLeaveDate: Date;
  note?: string;
}
const IgnoreEmployeesSchema = new Schema<IIgnoreEmployees>({
  code: { type: String, required: true },
  name: { type: String },
  division: { type: String },
  section: { type: String },
  position: { type: String },
  grade: { type: String },
  entryDate: { type: Date },
  actualLeaveDate: { type: Date },
  note: { type: String },
});

IgnoreEmployeesSchema.plugin(mongoosePaginate);
export interface IIgnoreEmployeesModel
  extends PaginateModel<IIgnoreEmployees> {}
const IgnoreEmployees = mongoose.model<IIgnoreEmployees, IIgnoreEmployeesModel>(
  "IgnoreEmployees",
  IgnoreEmployeesSchema
);

export default IgnoreEmployees;
