import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";
import { IReplacements } from "../../types/serviceEzv4.type";

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
  
  async  getNameCompanyStructure(rootId: number, limit: number | null) {
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
            children: buildTree(item.ID),
          }));
      }
  
      // Tìm node gốc trong mảng dữ liệu
      const rootNode = rows.find((item) => item.ID === rootId);
      if (!rootNode) return null;
  
      // Trả về JSON dạng cây
      return {
        name: rootNode.Name,
        children: buildTree(rootNode.ID),
      };
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  }
async  getNameByID(ID: string) {
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

}
