import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";
import { apiGetInfoUserEzV4 } from "../../config/axios";
import axios from "axios";
import dotenv from "dotenv";
import CompanyStructure from "../../models/models-project/companyStructure.model";
dotenv.config();
@injectable()
export class InfoUserEzV4 {
  private readonly API_GET_INFO_USER_EZV4 =
    process.env.API_GET_FULL_INFO_USER_EZV4;
  getInfoUserFromCode = async (code: string) => {
    console.log(code);
    try {
      const { data } = await apiGetInfoUserEzV4.post(
        `?employeeCode=${code}&includeResign=true`
      );
      return data;
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  };
  getDivHead = async (divisionId: string) => {
    try {
      const { data } = await axios.get(
        `${process.env.API_GET_DIV_HEAD}/?divisionId=${divisionId}`
      );
      if (data?.data?.result?.length > 0) {
        return data?.data?.result;
      }
      return [];
    } catch (error) {
      return [];
    }
  };
  getDepartmentNames = async (
    divisionId?: number,
    departmentId?: number,
    sectionId?: number,
    teamId?: number,
    groupId?: number
  ) => {
    const ids = [divisionId, departmentId, sectionId, teamId, groupId].filter(
      Boolean
    );

    if (ids.length === 0) return {};

    const departments = await CompanyStructure.find({ _id: { $in: ids } });

    const nameMap = new Map(departments.map((dep) => [dep._id, dep.name]));

    return {
      divisionName: divisionId ? nameMap.get(divisionId) || null : null,
      departmentName: departmentId ? nameMap.get(departmentId) || null : null,
      sectionName: sectionId ? nameMap.get(sectionId) || null : null,
      teamName: teamId ? nameMap.get(teamId) || null : null,
      groupName: groupId ? nameMap.get(groupId) || null : null,
    };
  };
  getFullInfoUserFromCode = async (code: string) => {
    try {
      const { data } = await axios.get(this.API_GET_INFO_USER_EZV4!, {
        params: { employeeId: code },
      });
      let userInfo = data.data.result || null;
      if (!userInfo) {
        const dbData = await this.getInfoUserFromCode(code);
        if (dbData.data.length > 0) {
          userInfo = dbData.data[0];
        }
      }
      if (!userInfo) return null;
      if (
        userInfo.divisionId ||
        userInfo.departmentId ||
        userInfo.sectionId ||
        userInfo.teamId ||
        userInfo.groupId
      ) {
        const departmentNames = await this.getDepartmentNames(
          userInfo.divisionId,
          userInfo.departmentId,
          userInfo.sectionId,
          userInfo.teamId,
          userInfo.groupId
        );
        return { ...userInfo, ...departmentNames };
      }
      return userInfo;
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  };
}
