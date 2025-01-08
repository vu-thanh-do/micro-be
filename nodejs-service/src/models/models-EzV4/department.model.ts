import { DataTypes } from "sequelize";
import { sequelizeSql } from "../../config/ezV4Db";

const Department = sequelizeSql.define(
  "Employee",
  {
    Avatar: DataTypes.STRING,
    Code: DataTypes.INTEGER,
  },
  {
    tableName: "Users", // Tên bảng trong cơ sở dữ liệu
    timestamps: true, // Nếu bảng có trường createdAt/updatedAt
  }
);
export default Department;
