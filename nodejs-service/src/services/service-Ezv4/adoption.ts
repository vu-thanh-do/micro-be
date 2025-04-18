import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";

@injectable()
class AdoptionEzV4 {
  async getDataFromRecCode(Code: string) {
    try {
      const dataFromRecCode = await sequelizeSql.query(
        `SELECT * FROM tbHR_RecruitmentCandidate WHERE Code = :Code`,
        {
          replacements: { Code },
          type: QueryTypes.SELECT
        }
      );
      return dataFromRecCode; // Trả về mảng các record khớp Code
    } catch (error) {
      console.error("Error in getDataFromRecCode:", error);
      return null;
    }
  }
}
export default AdoptionEzV4;
