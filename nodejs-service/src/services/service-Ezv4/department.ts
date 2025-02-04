import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
@injectable()
class DepartmentEzV4 {
  async getAllDepartmenrtEzv4() {
    try {
      const [users, metadata] = await sequelizeSql.query(
        "SELECT * FROM tbMD_CompanyStructure"
      );
      return users;
    } catch (error) {
      return error;
    }
  }
  async getNameById(id: string) {
    try {
      const [name, metadata] = await sequelizeSql.query(
        "SELECT * FROM tbMD_CompanyStructure where ID = :id"
      );
      return name;
    } catch (error) {
      return error;
    }
  }
}
export default DepartmentEzV4;
