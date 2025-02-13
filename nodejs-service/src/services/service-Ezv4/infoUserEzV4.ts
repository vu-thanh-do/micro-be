import { injectable } from "inversify";
import { sequelizeSql } from "../../config/ezV4Db";
import { QueryTypes } from "sequelize";
import { apiGetInfoUserEzV4 } from "../../config/axios";
import axios from "axios";
@injectable()
export class InfoUserEzV4 {
  getInfoUserFromCode = async (code: string) => {
    console.log(code)
    try {
      const { data } = await apiGetInfoUserEzV4.post(`?employeeCode=${code}&includeResign=true`);
      return data;
    } catch (error) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return null;
    }
  };

}
