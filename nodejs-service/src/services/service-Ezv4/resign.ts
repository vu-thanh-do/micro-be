import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import Language from "../../models/models-project/language.model";

// Định nghĩa interface cho kiểu dữ liệu ResignData
interface ResignEmployee {
  _id: string;
  code: string;
  name: string;
  division: string;
  section: string;
  position: string;
  grade: string;
  entryDate: string;
  actualLeaveDate: string;
  note?: string;
}

interface ResignData {
  dept: string;
  info: ResignEmployee[];
}

@injectable()
class ResignInfoEzv4 {
  //  Lấy 5 cấp phòng ban từ EmployeeID
 
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

  //  Lấy Position và Grade từ EmployeeID
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

  //  Lấy thông tin nghỉ việc theo deptId
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
          e.JoinDate,
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
 
  async getAllChildDepartments(parentDeptId: string): Promise<string[]> {
    const childDeptIds: string[] = [];
    async function fetchChildren(deptId: string) {
      const [rows] = await sequelizeSql.query(
        `SELECT ID FROM tbMD_CompanyStructure WHERE ParentID = :deptId`,
        { replacements: { deptId } }
      );
      for (const row of rows as any[]) {
        childDeptIds.push(row.ID);
        await fetchChildren(row.ID); // Đệ quy tiếp
      }
    }
    await fetchChildren(parentDeptId);
    return childDeptIds;
  }
  
  async getResignInfoOptimized({
    deptIds,
    page = 1,
    limit = 10,
    search = '',
    ignoreCodes = []
  }: {
    deptIds: string[];
    page: number;
    limit: number;
    search: string;
    ignoreCodes?: string[];
  }) {
    try {
      const offset = (page - 1) * limit;
      const deptIdsParam = deptIds.map(id => `'${id}'`).join(',');
      
      const ignoreCondition = ignoreCodes.length > 0 
        ? `AND e.EmployeeCode NOT IN (${ignoreCodes.map(code => `'${code}'`).join(',')})` 
        : '';
     
      // Lấy danh sách nhân viên nghỉ việc và chỉ lấy phòng ban hiện tại của họ (bản ghi mới nhất theo EffectiveDate)
      const countQuery = `
      WITH LatestDepartment AS (
        SELECT 
          dh.EmployeeID,
          dh.DepartmentID,
          ROW_NUMBER() OVER (PARTITION BY dh.EmployeeID ORDER BY dh.EffectiveDate DESC, dh.ID DESC) as RowNum
        FROM tbHR_DepartmentHistory dh
      )
      SELECT COUNT(*) AS Total
      FROM tbHR_Resign r
      JOIN tbHR_Employee e ON r.EmployeeID = e.ID
      JOIN LatestDepartment ld ON e.ID = ld.EmployeeID AND ld.RowNum = 1
      WHERE ld.DepartmentID IN (${deptIdsParam})
        ${search ? `AND e.EmployeeCode LIKE '%${search}%'` : ''}
        ${ignoreCondition}
      `;
      
      const [countResult] = await sequelizeSql.query(countQuery);
      const totalCount = (countResult[0] as any)?.Total || 0;
      
      // Truy vấn dữ liệu với phân trang
      const dataQuery = `
      WITH LatestDepartment AS (
        SELECT 
          dh.EmployeeID,
          dh.DepartmentID,
          ROW_NUMBER() OVER (PARTITION BY dh.EmployeeID ORDER BY dh.EffectiveDate DESC, dh.ID DESC) as RowNum
        FROM tbHR_DepartmentHistory dh
      )
      SELECT 
        r.ID AS ResignID,
        r.EmployeeID,
        e.EmployeeCode,
        e.FullName,
        e.Email,
        e.JoinDate,
        r.Detail,
        r.DaysOfNotification,
        r.IsLegal,
        r.LastWorkingDate,
        r.DecisionNo,
        r.DecisionDate,
        r.NoOfViolationDays,
        r.IsNeedReplacement,
        r.RecruitmentPeriod,
        r.ResignDate,
        ld.DepartmentID
      FROM tbHR_Resign r
      JOIN tbHR_Employee e ON r.EmployeeID = e.ID
      JOIN LatestDepartment ld ON e.ID = ld.EmployeeID AND ld.RowNum = 1
      WHERE ld.DepartmentID IN (${deptIdsParam})
        ${search ? `AND e.EmployeeCode LIKE '%${search}%'` : ''}
        ${ignoreCondition}
      ORDER BY r.ResignDate DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
      `;
      
      const [employees] = await sequelizeSql.query(dataQuery);
      

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
        data: results,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error: any) {
      console.error("Error in getResignInfoOptimized:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin nghỉ việc",
        error: error.message
      };
    }
  }
  // dovt resign specific
  async createResignSpecific(data: any) {
    try {
      const { deptName, info } = data;
      const key = `resign-${deptName}`;
      
      // Kiểm tra xem đã có dữ liệu cho phòng ban này chưa
      let dataResignSpecific = await Language.findOne({
        group: "resign",
        key: key
      });
      
      if (!dataResignSpecific) {
        // Nếu chưa có, tạo mới
        const newData = {
          group: "resign",
          key: key,
          data: {
            dept: deptName,
            info: Array.isArray(info) ? info : [info]
          }
        };
        
        console.log("Tạo mới dữ liệu:", JSON.stringify(newData));
        const created = await Language.create(newData);
        console.log("Kết quả tạo mới:", created._id);
        return {
          status: 201,
          message: "Tạo thông tin nghỉ việc đặc biệt thành công",
          data: created
        };
      } else {
        // Nếu đã có, thêm thông tin vào mảng info hiện có
        const currentData = dataResignSpecific.data as ResignData || { dept: deptName, info: [] };
        const currentInfo = currentData.info || [];
        
        // Tìm xem có nhân viên trùng ID không
        const existingIndex = currentInfo.findIndex(
          (item: ResignEmployee) => item._id === (Array.isArray(info) ? info[0]._id : info._id)
        );
        
        if (existingIndex >= 0) {
          // Nếu đã có nhân viên này, thay thế thông tin
          if (Array.isArray(info)) {
            currentInfo[existingIndex] = info[0];
          } else {
            currentInfo[existingIndex] = info;
          }
        } else {
          // Nếu chưa có, thêm mới
          if (Array.isArray(info)) {
            currentInfo.push(...info);
          } else {
            currentInfo.push(info);
          }
        }
        
        // Cập nhật dữ liệu
        console.log("Cập nhật dữ liệu cho document:", dataResignSpecific._id);
        dataResignSpecific.data = {
          dept: deptName,
          info: currentInfo
        };
        
        // Gọi markModified để báo cho Mongoose biết rằng trường data đã thay đổi
        dataResignSpecific.markModified('data');
        
        // Lưu thay đổi
        const updated = await dataResignSpecific.save();
        console.log("Kết quả cập nhật:", updated._id, "Số lượng nhân viên:", (updated.data as ResignData).info.length);
        return {
          status: 200,
          message: "Cập nhật thông tin nghỉ việc đặc biệt thành công",
          data: updated
        };
      }
    } catch (error: any) {
      console.error("Error in createResignSpecific:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi tạo thông tin nghỉ việc",
        error: error.message
      };
    }
  }
  
  // Xóa một nhân viên nghỉ việc đặc biệt theo ID
  async deleteResignSpecificEmployee(deptName: string, employeeId: string) {
    try {
      const key = `resign-${deptName}`;
      
      // Tìm dữ liệu của phòng ban
      const dataResignSpecific = await Language.findOne({
        group: "resign",
        key: key
      });
      
      if (!dataResignSpecific) {
        return {
          status: 404,
          message: "Không tìm thấy thông tin nghỉ việc đặc biệt cho phòng ban này",
          data: null
        };
      }
      
      // Xóa nhân viên khỏi danh sách
      const currentData = (dataResignSpecific.data as ResignData) || { dept: deptName, info: [] };
      const currentInfo = currentData.info || [];
      
      const newInfo = currentInfo.filter((emp: ResignEmployee) => emp._id !== employeeId);
      
      // Nếu không có thay đổi, nghĩa là không tìm thấy nhân viên
      if (newInfo.length === currentInfo.length) {
        return {
          status: 404,
          message: "Không tìm thấy nhân viên có ID cần xóa",
          data: null
        };
      }
      
      // Cập nhật dữ liệu
      dataResignSpecific.data = {
        dept: deptName,
        info: newInfo
      } as ResignData;
      
      const updated = await dataResignSpecific.save();
      return {
        status: 200,
        message: "Xóa thông tin nhân viên nghỉ việc đặc biệt thành công",
        data: updated
      };
    } catch (error: any) {
      console.error("Error in deleteResignSpecificEmployee:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi xóa thông tin nhân viên nghỉ việc",
        error: error.message
      };
    }
  }
  
  // Xóa nhiều nhân viên nghỉ việc đặc biệt
  async deleteMultipleResignSpecificEmployees(deptName: string, employeeIds: string[]) {
    try {
      const key = `resign-${deptName}`;
      
      // Tìm dữ liệu của phòng ban
      const dataResignSpecific = await Language.findOne({
        group: "resign",
        key: key
      });
      
      if (!dataResignSpecific) {
        return {
          status: 404,
          message: "Không tìm thấy thông tin nghỉ việc đặc biệt cho phòng ban này",
          data: null
        };
      }
      
      // Xóa nhiều nhân viên khỏi danh sách
      const currentData = (dataResignSpecific.data as ResignData) || { dept: deptName, info: [] };
      const currentInfo = currentData.info || [];
      
      const newInfo = currentInfo.filter((emp: ResignEmployee) => !employeeIds.includes(emp._id));
      
      // Nếu không có thay đổi, nghĩa là không tìm thấy nhân viên nào
      if (newInfo.length === currentInfo.length) {
        return {
          status: 404,
          message: "Không tìm thấy nhân viên cần xóa",
          data: null
        };
      }
      
      // Cập nhật dữ liệu
      dataResignSpecific.data = {
        dept: deptName,
        info: newInfo
      } as ResignData;
      
      const updated = await dataResignSpecific.save();
      return {
        status: 200,
        message: `Đã xóa ${currentInfo.length - newInfo.length} nhân viên nghỉ việc đặc biệt`,
        data: updated
      };
    } catch (error: any) {
      console.error("Error in deleteMultipleResignSpecificEmployees:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi xóa thông tin nhiều nhân viên nghỉ việc",
        error: error.message
      };
    }
  }
  

  async deleteResignSpecific(deptName: string) {
    try {
      const key = `resign-${deptName}`;
      
      // Xóa dữ liệu
      const result = await Language.deleteOne({
        group: "resign",
        key: key
      });
      
      if (result.deletedCount === 0) {
        return {
          status: 404,
          message: "Không tìm thấy thông tin nghỉ việc đặc biệt cho phòng ban này",
          data: null
        };
      }
      
      return {
        status: 200,
        message: "Xóa thông tin nghỉ việc đặc biệt thành công",
        data: result
      };
    } catch (error: any) {
      console.error("Error in deleteResignSpecific:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi xóa thông tin nghỉ việc đặc biệt",
        error: error.message
      };
    }
  }
  
  // Lấy danh sách nhân viên nghỉ việc đặc biệt của một phòng ban
  async getResignSpecific(deptName: string) {
    try {
      const key = `resign-${deptName}`;
      
      // Tìm dữ liệu của phòng ban
      const dataResignSpecific = await Language.findOne({
        group: "resign",
        key: key
      });
      
      if (!dataResignSpecific) {
        return {
          status: 404,
          message: "Không tìm thấy thông tin nghỉ việc đặc biệt cho phòng ban này",
          data: null
        };
      }
      
      return {
        status: 200,
        message: "Lấy thông tin nghỉ việc đặc biệt thành công",
        data: dataResignSpecific
      };
    } catch (error: any) {
      console.error("Error in getResignSpecific:", error);
      return {
        status: 500,
        message: "Đã xảy ra lỗi khi lấy thông tin nghỉ việc đặc biệt",
        error: error.message
      };
    }
  }
}

export default ResignInfoEzv4;
