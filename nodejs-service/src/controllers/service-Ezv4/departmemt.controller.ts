import Department from "../../models/models-EzV4/department.model";

class DepartmentEzV4 {
  async getAllDepartmenrtEzv4() {
    try {
      return await Department.findAll();
    } catch (error) {
      throw error;
    }
  }
}
export default DepartmentEzV4;
