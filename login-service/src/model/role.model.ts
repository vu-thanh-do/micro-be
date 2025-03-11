import { DataTypes, Model } from "sequelize";
import { sequelizeSql } from "../config/db";

interface Permission {
  PermissionName: string;
  Actions: {
    ActionName: string;
    Route?: string;  // đường dẫn frontend nếu cần
  }[];
}

interface RoleAttributes {
  RoleId: string;
  RoleName: string;
  Permission: Permission[];
  CreatedDate?: Date;
}

class Role extends Model<RoleAttributes> implements RoleAttributes {
  public RoleId!: string;
  public RoleName!: string;
  public Permission!: Permission[];
  public CreatedDate!: Date;
}

Role.init(
  {
    RoleId: {
      type: DataTypes.STRING,
      primaryKey: true,
      field: "RoleId",
    },
    RoleName: {
      type: DataTypes.STRING,
      field: "RoleName",
    },
    Permission: {
      type: DataTypes.TEXT,
      field: "Permission",
      get() { 
        const rawValue = this.getDataValue('Permission') as unknown as string;
        return rawValue ? JSON.parse(rawValue) as Permission[] : [];
      },
      set(value: Permission[]) {
        this.setDataValue('Permission', JSON.stringify(value) as any);
      }
    },
    CreatedDate: {
      type: DataTypes.DATE,
      field: "CreatedDate"
    }
  },
  {
    tableName: "Role",
    timestamps: false,
    createdAt: false,
    updatedAt: false,
    sequelize: sequelizeSql,
  }
);

export default Role;
