import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize"; 
@injectable()
export class HeadCountRecruitEzV4 {
  getHeadCountByDiv = async (depId: string) => {
    try {
      const [headCount, metadata] = await sequelizeSql.query(
        `SELECT * FROM tbRC_HeadCountPlan WHERE DepartmentID = :depId`,
        {
          replacements: { depId },
          type: QueryTypes.SELECT,
        }
      );
      return headCount;
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  };
}
