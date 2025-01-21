import Employee from "../../models/models-EzV4/department.model";

class DepartmentEzV4 {
  async getAllDepartmenrtEzv4() {
    try {
      const employees = await Employee.findAll({
        attributes: ["ID", "FullName", "Email", "JoinDate", "PhoneNumber"],
      });
      console.log(employees);
      return employees
    } catch (error) {
      return error;
    }
  }
}
export default DepartmentEzV4;
