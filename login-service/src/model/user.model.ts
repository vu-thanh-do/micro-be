// user.model.ts
import { Sequelize, DataTypes, Model } from "sequelize";
import { UserAttributes } from "../types/Iuser";
import { sequelizeSql } from "../config/db";

// Định nghĩa model Users kế thừa từ Sequelize Model
class Users extends Model<UserAttributes> implements UserAttributes {
  public UserId!: string;
  public EmployeeCode!: string;
  public Avatar!: string;
  public Email!: string;
  public Username!: string;
  public RoleId!: string;
  public Password!: string;
  public RefreshToken!: string;
  public Code!: string;
  public CreatedDate!: Date;
  public UpdatedDate?: Date;
  public CreatedBy?: string;
  public UpdatedBy?: string;
}

// Khởi tạo model Users
Users.init(
  {
    UserId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    EmployeeCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    RoleId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    RefreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CreatedDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    UpdatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    CreatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    UpdatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeSql,
    tableName: "Users",
    timestamps: false, 
  }
);

export default Users;
