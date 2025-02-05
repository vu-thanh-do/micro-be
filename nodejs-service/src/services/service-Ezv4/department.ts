import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";
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
  async getNameById(id: number) {
    try {
      const [results] = await sequelizeSql.query(
        "SELECT * FROM tbMD_CompanyStructure WHERE ID = :id",
        { replacements: { id }, type: QueryTypes.SELECT }
      );
      return results;
    } catch (error) {
      console.error("Error in getNameById:", error);
      throw new Error("Database query failed");
    }
  }
}
export default DepartmentEzV4;
