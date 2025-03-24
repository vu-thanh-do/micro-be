import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";

@injectable()
class ResignInfoEzv4 {
  // ✅ Lấy 5 cấp phòng ban từ EmployeeID
  async getDepartmentInfoByEmployee(employeeId: number) {
    try {
      const [[latestDept] = []] = await sequelizeSql.query(
        `
        SELECT TOP 1 DepartmentID
        FROM tbHR_DepartmentHistory
        WHERE EmployeeID = :employeeId
        ORDER BY EffectiveDate DESC
        `,
        { replacements: { employeeId } }
      );

      if (!(latestDept as any)?.DepartmentID) return null;

      const [hierarchy] = await sequelizeSql.query(
        `
        ;WITH DepartmentRecursive AS (
          SELECT ID, ParentID, Name, 1 AS Level
          FROM tbMD_CompanyStructure
          WHERE ID = :departmentId

          UNION ALL

          SELECT d.ID, d.ParentID, d.Name, dr.Level + 1
          FROM tbMD_CompanyStructure d
          INNER JOIN DepartmentRecursive dr ON d.ID = dr.ParentID
          WHERE d.ID <> d.ParentID
        )
        SELECT
            MAX(CASE WHEN Level = 1 THEN ID END) AS teamId,
            MAX(CASE WHEN Level = 1 THEN Name END) AS teamName,
            MAX(CASE WHEN Level = 2 THEN ID END) AS groupId,
            MAX(CASE WHEN Level = 2 THEN Name END) AS groupName,
            MAX(CASE WHEN Level = 3 THEN ID END) AS sectionId,
            MAX(CASE WHEN Level = 3 THEN Name END) AS sectionName,
            MAX(CASE WHEN Level = 4 THEN ID END) AS departmentId,
            MAX(CASE WHEN Level = 4 THEN Name END) AS departmentName,
            MAX(CASE WHEN Level = 5 THEN ID END) AS divisionId,
            MAX(CASE WHEN Level = 5 THEN Name END) AS divisionName
        FROM DepartmentRecursive
        OPTION (MAXRECURSION 10)
        `,
        { replacements: { departmentId: (latestDept as any).DepartmentID } }
      );

      return hierarchy?.[0] ?? null;
    } catch (error) {
      console.error("Error in getDepartmentInfoByEmployee:", error);
      return null;
    }
  }

  // ✅ Lấy Position và Grade từ EmployeeID
  async getPositionAndGradeByEmployee(employeeId: number) {
    try {
      const [[position] = []] = await sequelizeSql.query(
        `
        SELECT TOP 1
            jp.Name AS position,
            jr.Name AS grade
        FROM tbHR_PositionHistory ph
        JOIN tbMD_JobPoint jp ON ph.JobPointID = jp.ID
        JOIN tbMD_JobRank jr ON jp.JobRankID = jr.ID
        WHERE ph.EmployeeID = :employeeId
        ORDER BY ph.EffectiveDate DESC
        `,
        { replacements: { employeeId } }
      );

      return position ?? null;
    } catch (error) {
      console.error("Error in getPositionAndGradeByEmployee:", error);
      return null;
    }
  }

  // ✅ Lấy thông tin nghỉ việc theo deptId
  async getResignInfo(deptId: string) {
    try {
      const [employees] = await sequelizeSql.query(
        `
        SELECT 
          r.ID AS ResignID,
          r.EmployeeID,
          e.EmployeeCode,
          e.FullName,
          e.Email,
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
        WHERE dh.DepartmentID = :deptId
        ORDER BY r.ResignDate DESC
        `,
        { replacements: { deptId } }
      );

      const results = await Promise.all(
        employees.map(async (emp: any) => {
          const [deptInfo, positionInfo] = await Promise.all([
            this.getDepartmentInfoByEmployee(emp.EmployeeID),
            this.getPositionAndGradeByEmployee(emp.EmployeeID)
          ]);

          return {
            ...emp,
            ...deptInfo,
            ...positionInfo
          };
        })
      );

      return {
        status: 200,
        message: "Thành công",
        data: results
      };
    } catch (error: any) {
      console.error("Error in getResignInfo:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin nghỉ việc",
        error: error.message
      };
    }
  }
}

export default ResignInfoEzv4;
