import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
interface ICompanyStructure {
  _id: number;
  name: string;
  code: string;
  parentId: number;
  managerId: number;
  flowPICId: number;
  isActive: boolean;
  branchId: number;
  orderId: number;
}
const CompanyStructureSchema = new mongoose.Schema<ICompanyStructure>({
  _id: Number,
  name: String,
  code: String,
  parentId: Number,
  managerId: Number,
  flowPICId: Number,
  isActive: Boolean,
  branchId: Number,
  orderId: Number,
});

CompanyStructureSchema.plugin(mongoosePaginate);
interface ICompanyStructureModel extends mongoose.PaginateModel<ICompanyStructure> {}
const CompanyStructure = mongoose.model<ICompanyStructure, ICompanyStructureModel>("CompanyStructure", CompanyStructureSchema);
export default CompanyStructure;
export type CompanyStructureDocument = mongoose.PaginateModel<typeof CompanyStructureSchema>;
