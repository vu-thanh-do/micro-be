import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";
import { IReplacements } from "../../types/serviceEzv4.type";
import RecruitmentSummary from "../../models/models-project/recruitmentSummary.model";

@injectable()
export class HeadCountRecruitEzV4 {
  getHeadCountByDiv = async (
    division: string,
    year: string,
    department?: string | null
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
  async checkResignByDept(deptId: string) {
    try {
      let query = `SELECT
        e.*,
        dh.*,
        r.*
      FROM tbHR_Employee e
      JOIN tbHR_DepartmentHistory dh 
        ON e.ID = dh.EmployeeID
      JOIN tbHR_Resign r
        ON e.ID = r.EmployeeID
      WHERE dh.DepartmentID = :deptID`;
      const result = await sequelizeSql.query(query, {
        replacements: { deptID: deptId },
        type: QueryTypes.SELECT,
      });

      return result;
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  }
  async getNameCompanyStructure(rootId: number, limit: number | null) {
    try {
      let query = `
        WITH RecursiveCTE AS (
            SELECT ID, ParentID, Name, 0 AS Level
            FROM tbMD_CompanyStructure
            WHERE ID = :rootId
  
            UNION ALL
  
            SELECT c.ID, c.ParentID, c.Name, r.Level + 1
            FROM tbMD_CompanyStructure c
            INNER JOIN RecursiveCTE r ON c.ParentID = r.ID
            WHERE (:limit IS NULL OR r.Level + 1 < :limit)
        )
        SELECT * FROM RecursiveCTE;
      `;

      const result = await sequelizeSql.query(query, {
        replacements: { rootId, limit },
        type: QueryTypes.SELECT,
      });

      let rows: any[] = Array.isArray(result) ? result : [result];

      console.log("Dữ liệu rows sau xử lý:", rows);

      // Hàm đệ quy để xây dựng JSON
      function buildTree(parentId: number): any[] {
        return rows
          .filter((item: any) => item.ParentID === parentId)
          .map((item: any) => ({
            name: item.Name,
            id: item.ID,
            children: buildTree(item.ID),
          }));
      }

      // Tìm node gốc trong mảng dữ liệu
      const rootNode = rows.find((item) => item.ID === rootId);
      if (!rootNode) return null;

      // Trả về JSON dạng cây
      return {
        name: rootNode.Name,
        id: rootNode.ID,
        children: buildTree(rootNode.ID),
      };
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  }
  async getNameByID(ID: string) {
    try {
      let query = `
      SELECT * FROM tbMD_CompanyStructure WHERE ID = :ID
    `;
      const result = await sequelizeSql.query(query, {
        replacements: { ID },
        type: QueryTypes.SELECT,
      });
      if (!result || result.length === 0) {
        console.log(`Không tìm thấy dữ liệu với ID: ${ID}`);
        return null;
      }
      return result[0];
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  }
  getHeadCountByDept = async (
    division: string,
    year: string,
    department?: string | null
  ) => {
    try {
      const fiscalYear = Number(year);
      const prevYear = fiscalYear - 1;
      const nextYear = fiscalYear + 1;
  
      let query = `
        SELECT 
          h.*,
          dept.Name AS departmentName,
          divi.Name AS divisionName
        FROM tbRC_HeadCountPlan h
        LEFT JOIN tbMD_CompanyStructure dept ON h.DepartmentID = dept.ID
        LEFT JOIN tbMD_CompanyStructure divi ON h.DivisionID = divi.ID
        WHERE h.DivisionID = :division
          AND (
            (h.FiscalYear = :prevYear AND h.Month = 3)
            OR (h.FiscalYear = :fiscalYear AND h.Month BETWEEN 4 AND 12)
            OR (h.FiscalYear = :nextYear AND h.Month BETWEEN 1 AND 3)
          )
      `;
  
      const replacements: {
        division: string;
        fiscalYear: number;
        prevYear: number;
        nextYear: number;
        department?: string;
      } = {
        division,
        fiscalYear,
        prevYear,
        nextYear,
      };
  
      if (department) {
        query += ` AND h.DepartmentID = :department`;
        replacements.department = department;
      }
  
      query += ` ORDER BY h.FiscalYear ASC, h.Month ASC`;
  
      const headCounts = (await sequelizeSql.query(query, {
        replacements,
        type: QueryTypes.SELECT,
      })) as {
        DepartmentID: number;
        FiscalYear: number;
        Month: number;
        Actual: number | null; 
        adjust: number;
        totalHC: number;
      }[];
  
      // ✅ Lấy danh sách điều chỉnh từ MongoDB
      const deptIds = [...new Set(headCounts.map(h => h.DepartmentID))];
      const adjustments = await RecruitmentSummary.find({
        departmentId: { $in: deptIds },
        year: { $in: [prevYear, fiscalYear, nextYear] },
      });
  
      const adjustMap = new Map<string, number>();
      for (const adj of adjustments) {
        const key = `${adj.departmentId}-${adj.year}-${adj.month}`;
        adjustMap.set(key, adj.adjust || 0);
      }
  
      // ✅ Gắn adjust và totalHC vào từng dòng
      for (const row of headCounts) {
        const key = `${row.DepartmentID}-${row.FiscalYear}-${row.Month}`;
        const adjust = adjustMap.get(key) || 0;
        row["adjust"] = adjust;
        row["totalHC"] = (row.Actual ?? 0) + adjust;
      }
  
      // ✅ Nhóm theo phòng ban để tính recAP
      const grouped: Record<string, any[]> = {};
      for (const row of headCounts) {
        const key = row.DepartmentID;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      }
  
      const recAPByDepartment = Object.entries(grouped).map(
        ([departmentId, records]) => {
          const sorted = (records as any[]).sort((a, b) =>
            a.FiscalYear !== b.FiscalYear
              ? a.FiscalYear - b.FiscalYear
              : a.Month - b.Month
          );
  
          let recAP = 0;
          for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1].totalHC;
            const curr = sorted[i].totalHC;
            const diff = curr - prev;
            if (diff > 0) recAP += diff;
          }
  
          return {
            departmentId: Number(departmentId),
            recAP,
          };
        }
      );
  
      const totalRecAP = recAPByDepartment.reduce((sum, d) => sum + d.recAP, 0);
  
      return {
        recAP: totalRecAP,
        data: headCounts,
        recAPByDepartment,
      };
    } catch (error) {
      console.error("❌ Lỗi khi truy vấn dữ liệu HeadCount:", error);
      return null;
    }
  };
  
}
