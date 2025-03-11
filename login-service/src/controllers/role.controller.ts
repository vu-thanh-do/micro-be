import { Request, Response } from "express";
import Role from "../model/role.model";
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

export const RoleController = {
  getRole: async (req: Request, res: Response) : Promise<any> => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const whereClause = search 
        ? {
            RoleName: {
              [Op.like]: `%${search}%`
            }
          }
        : {};
      
      if (search) {
        // Khi có search, lấy tất cả kết quả không phân trang
        const roles = await Role.findAll({
          where: whereClause,
          order: [['RoleId', 'DESC']]
        });
        return res.json({
          roles,
          totalItems: roles.length,
          currentPage: 1,
          totalPages: 1
        });
      } else {
        // Khi không có search, giữ nguyên logic phân trang
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows: roles } = await Role.findAndCountAll({
          where: whereClause,
          limit: Number(limit),
          offset: offset,
          order: [['RoleId', 'DESC']]
        });
        return res.json({
          roles,
          totalItems: count,
          totalPages: Math.ceil(count / Number(limit)),
          currentPage: Number(page)
        });
      }
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },
  getRoleById: async (req: Request, res: Response)  : Promise<any>  => {
    const { id } = req.params;
    console.log(id,'cccccccccccc')
    try {
  
      const role = await Role.findByPk(id);
      return res.json({
        status: 200,
        message: "Successfully",
        data: role
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Error fetching role" });
    }
    },
  createRole: async (req: Request, res: Response): Promise<any> => {
    const { PermissionName :name , Actions:permission} = req.body;
    console.log(name,permission,'cccccccccccc'  )
    try {
     
      // Kiểm tra xem role name đã tồn tại chưa
    
      const existingRole = await Role.findOne({
        where: {
          RoleName: name
        }
      });
      if (existingRole) {
        return res.status(400).json({
          status: 400,
          message: "Role name already exists"
        });
      }
      const newRole = await Role.create({
        RoleId: uuidv4(),
        RoleName: name,
        Permission: permission,
        CreatedDate: new Date(),
      });
      return res.status(201).json({
        status: 201,
        message: "Role created successfully",
        data: newRole
      });
      
    } catch (error : any) {
      return res.status(500).json({ 
        status: 500,
        message: "Error creating role",
        error: error.message 
      });
    }
  },
  updateRole: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { PermissionName:name, Actions:permission } = req.body;
      const role = await Role.findByPk(id); 
      if (!role) {
        return res.status(404).json({
          status: 404,
          message: "Role not found"
        });
      }
      await role.update({
        RoleName: name,
        Permission: permission
      });
      return res.status(200).json({
        status: 200,
        message: "Role updated successfully", 
        data: role
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        message: "Error updating role",
        error: error.message
      });
    }
  },
  deleteRole: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;  
      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          status: 404,
          message: "Role not found"
        }); 
      }
      await role.destroy();
      return res.status(200).json({
        status: 200,
        message: "Role deleted successfully"
      }); 
    } catch (error: any) {
      return res.status(500).json({
        status: 500,
        message: "Error deleting role",
        error: error.message
      }); 
    }
  }
};

