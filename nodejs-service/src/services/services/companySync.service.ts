import CompanyStructure from "../../models/models-project/companyStructure.model";
import { sequelizeSql } from "../../config/ezV4Db";
import { injectable } from "inversify";
@injectable()
export class CompanySyncService {
  async syncCompanyStructureFromSQL() {
    try {
      const [results] = await sequelizeSql.query(`
      SELECT ID, Name, Code, ParentID, ManagerID, FlowPICID, IsActive, BranchID, OrderID
      FROM tbMD_CompanyStructure
    `);

      const departments = results.map((dep: any) => ({
        _id: dep.ID,
        name: dep.Name,
        code: dep.Code,
        parentId: dep.ParentID,
        managerId: dep.ManagerID,
        flowPICId: dep.FlowPICID,
        isActive: !!dep.IsActive,
        branchId: dep.BranchID,
        orderId: dep.OrderID,
      }));

      await CompanyStructure.deleteMany();
      await CompanyStructure.insertMany(departments);

      return {
        success: true,
        message: `Đồng bộ thành công ${departments.length} phòng ban`,
        count: departments.length,
      };
    } catch (error: any) {
      console.error("❌ Lỗi đồng bộ phòng ban:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async findByName(name: string) {
    return await CompanyStructure.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }
  async findById(id: string) {
    return await CompanyStructure.findOne({ _id: id });
  }
  async getAllParents(department: any, result: any[] = []): Promise<any[]> {
    if (!department?.parentId) return result;
    const parent = await CompanyStructure.findOne({ _id: department.parentId });
    if (parent) {
      result.push(parent);
      return this.getAllParents(parent, result);
    }
    return result;
  }

  async getAllChildren(id: number): Promise<any[]> {
    const children = await CompanyStructure.find({ parentId: id });
    const result = [...children];
    for (const child of children) {
      const sub = await this.getAllChildren(child._id);
      result.push(...sub);
    }
    return result;
  }
  async getOneChild(id: number):Promise<any> {
    const children = await CompanyStructure.find({ parentId: id });
    const result = [...children];
    return result;
  }
  async findDepartmentWithHierarchy(name: string) {
    const target = await this.findByName(name);
    if (!target) return null;
    const parents = await this.getAllParents(target);
    const children = await this.getAllChildren(target._id);
    return {
      target,
      parents: parents.reverse(), // từ trên xuống
      children,
    };
  }
  async getAllDepartment({ page = 1, limit = 10}: { page?: number, limit?: number}) {
    const query: any = {};
    const result = await CompanyStructure.paginate(query, {
      page,
      limit,
      sort: { orderId: 1 },
    });
    return result;
  }
  async findDepartmentChild(id: string) {
    const target = await this.findById(id);
    if (!target) return null;
    const children = await this.getOneChild(target._id);
    return {
      target,
      children,
    };
  }
}
