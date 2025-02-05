import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";
import { IReplacements } from "../../types/serviceEzv4.type";
@injectable()
export class HeadCountRecruitEzV4 {
  getHeadCountByDiv = async (
    division: string,
    year: string,
    department?: string  | null
  ) => {
    try {
      let query = `SELECT * FROM tbRC_HeadCountPlan WHERE DivisionID = :division`;
      const replacements: IReplacements = { division };
      if (year) {
        query += ` AND FiscalYear = :year`;
        replacements.year = year;
      }
      if (department) {
        query += ` AND DepartmentID = :department`;
        replacements.department = department;
      }
      query += ` ORDER BY Month ASC`;
      const headCount = await sequelizeSql.query(query, {
        replacements,
        type: QueryTypes.SELECT,
      });
      return headCount;
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  };
}
