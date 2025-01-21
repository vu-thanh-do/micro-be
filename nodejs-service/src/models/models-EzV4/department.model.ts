import { DataTypes } from "sequelize";
import { sequelizeSql } from "../../config/ezV4Db";

const Employee = sequelizeSql.define(
  "Employee",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: "ID", // Tên cột thực tế trong database
    },
    FullName: {
      type: DataTypes.STRING,
      field: "FullName",
    },
    Email: {
      type: DataTypes.STRING,
      field: "Email",
    },
    JoinDate: {
      type: DataTypes.DATE,
      field: "JoinDate",
    },
    PhoneNumber: {
      type: DataTypes.STRING,
      field: "PhoneNumber",
    },
  },
  {
    tableName: "tbHR_Employee",
    timestamps: false, // Tắt timestamps nếu bảng không có cột createdAt/updatedAt
  }
);

export default Employee;
