import { DataTypes } from "sequelize";
import { sequelizeSql } from "../config/db";

const Role = sequelizeSql.define(
  "Role",
  {
    RoleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: "RoleId",
    },
    RoleName: {
      type: DataTypes.STRING,
      field: "RoleName",
    },
    Permission: {
      type: DataTypes.STRING,
      field: "Permission",
    },
  },
  {
    tableName: "Role",
    timestamps: false,
  }
);
export default Role;
