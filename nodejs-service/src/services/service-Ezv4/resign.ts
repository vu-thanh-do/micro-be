import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
@injectable()
class ResignInfoEzv4 {
  async getResignInfo(dept: string) {
    try {
      const [results] = await sequelizeSql.query(
        ` SELECT 
            e.EmployeeCode,
            e.FullName,
            e.Email,
            d.Name AS DepartmentName,
            r.ResignID,
            r.Detail,
            r.DaysOfNotification,
            r.IsLegal,
            r.LastWorkingDate,
            r.DecisionNo,
            r.DecisionDate,
            r.NoOfViolationDays,
            r.IsNeedReplacement,
            r.RecruitmentPeriod,
            r.ResignDate
        FROM tbHR_Resign r
        JOIN tbHR_Employee e ON r.EmployeeID = e.ID
        JOIN tbHR_DepartmentHistory dh ON e.ID = dh.EmployeeID
        JOIN tbMD_CompanyStructure d ON dh.DepartmentID = d.ID
        WHERE d.ID = :dept
        ORDER BY r.ResignDate DESC;
           `,
        { replacements: { dept } }
      );
      return {
        status: 200,
        message: "thành công",
        data: results,
      };
    } catch (error: any) {
      console.error("Error in getResignInfo:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin nghỉ việc",
        error: error.message,
      };
    }
  }
}
export default ResignInfoEzv4;
