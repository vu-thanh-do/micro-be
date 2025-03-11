export interface UserAttributes {
    UserId: string;
    EmployeeCode: string;
    Avatar: string;
    Email: string;
    Username: string;
    RoleId: string;
    Password: string;
    RefreshToken: string;
    Code: string;
    CreatedDate: Date;
    UpdatedDate?: Date;
    CreatedBy?: string;
    UpdatedBy?: string;
  }

interface Permission {
  PermissionName: string; 
  Actions: {
    ActionName: string;
    Route?: string;
  }[];
}

export interface RoleAttributes {
  RoleId: string;
  RoleName: string;
  Permission: Permission[];
  CreatedDate?: Date;
}