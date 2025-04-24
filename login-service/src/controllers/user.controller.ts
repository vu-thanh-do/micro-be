import { Request, Response } from "express";
import { redis } from "../config/redis";
import Users from "../model/user.model";
import jwt from "jsonwebtoken";
import { apiGetInfoUserEzV4 } from "../config/axios";
import { Op } from "sequelize";
import { sendRpcRequest, sendToQueue } from "../config/rabbitMQ/rabbitMq";
import Role from "../model/role.model";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Mở rộng kiểu Request để thêm trường user
interface AuthRequest extends Request {
  user?: {
    UserId: string;
    username: string;
    role: string;
  };
}

export const UserController = {
  getOneUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      console.log(id);
      let user: any = await redis.hgetall(`user:${id}`);
      if (!user || Object.keys(user).length === 0) {
        user = await Users.findByPk(id);
        if (!user) return null;
        // Cache lại vào Redis
        const dataSaveRedis = {
          UserId: user.UserId,
          Username: user.Username,
          Email: user.Email,
          RoleId: user.RoleId,
          Avatar: user.Avatar,
        };
        await redis.hmset(`user:${user.UserId}`, dataSaveRedis);
        await redis.expire(`user:${user.UserId}`, 3600);
        user = dataSaveRedis;
      }
      return res.status(200).json({
        status: 200,
        data: user,
        message: "success",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
  getOneFromToken: async (req: any, res: Response): Promise<any> => {
    try {
      const { UserId } = req.user;
      const user = await Users.findByPk(UserId);
  
      if (!user) {
        return res.status(400).json({
          status: 400,
          data: null,
          message: "Token không hợp lệ hoặc user không tồn tại!",
        });
      }
  
      const dataRole = await Role.findByPk(user.RoleId);
  
      if (!dataRole) {
        return res.status(400).json({
          status: 400,
          data: null,
          message: "Không tìm thấy Role tương ứng!",
        });
      }
  
      const dataSaveRedis = {
        UserId: user.UserId,
        Username: user.Username,
        Email: user.Email,
        RoleId: user.RoleId,
        Avatar: user.Avatar,
        EmployeeCode: user.EmployeeCode,
        RoleName: dataRole.RoleName,
        Permission: dataRole.Permission, // Đã parse JSON nhờ getter trong model
      };
  
      return res.status(200).json({
        status: 200,
        data: dataSaveRedis,
        message: "success",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
  
  getInfoUserFromCode: async (req: Request, res: Response): Promise<any> => {
    try {
      const { code } = req.params;
      const { data } = await apiGetInfoUserEzV4.get(`/${code}`);

      const newData = {
        employeeId: data.data.result.employeeId,
        departmentId: data.data.result.departmentId,
        divisionId: data.data.result.divisionId,
        sectionId: data.data.result.sectionId,
        groupId: data.data.result.groupId,
      };
      return res.status(200).json({
        status: 200,
        data: newData,
        message: "success",
      });
    } catch (error: any) {
      console.error("Lỗi khi truy vấn dữ liệu:", error);
      return res.status(500).json({
        message: error.message,
      });
    }
  },
  getAllUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const whereClause = search
        ? {
          EmployeeCode: {
              [Op.like]: `%${search}%`,
            },
          }
        : {};
        if(search){
          const users = await Users.findAll({
            where: whereClause,
            order: [["UserId", "DESC"]],
            attributes : {
              exclude  : ["Password", "RefreshToken"]
            }
          });
          return res.status(200).json({
            status: 200,
            data: users,
            message: "success",
          });
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows: users } = await Users.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset: offset,
        order: [["UserId", "DESC"]],
        attributes : {
          exclude  : ["Password", "RefreshToken"]
        }
      });
      return res.status(200).json({
        status: 200,
        data: users,
        totalItems: count,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page),
        message: "success",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },

  // Thêm user mới
  createUser: async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { 
        employeeCode, 
        email, 
        username, 
        password, 
        roleId = "4F2BF40B-52D5-41E5-9CC2-B8251B436F4E", // Mặc định là role thường
        avatar = "image/male.jpg",
        code
      } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!employeeCode || !email || !username || !password) {
        return res.status(400).json({
          status: 400,
          message: "Thiếu thông tin bắt buộc: mã nhân viên, email, tên người dùng, mật khẩu",
          data: null
        });
      }

      // Kiểm tra xem user đã tồn tại chưa
      const normalizedCode = employeeCode.toLowerCase().replace(/^(dmvn|vn)/g, "");
      const existingUser = await Users.findOne({
        where: { EmployeeCode: normalizedCode }
      });

      if (existingUser) {
        return res.status(400).json({
          status: 400,
          message: "Người dùng với mã nhân viên này đã tồn tại",
          data: null
        });
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo user mới
      const newUser = await Users.create({
        UserId: uuidv4(),
        EmployeeCode: normalizedCode,
        Email: email,
        Username: username,
        Password: hashedPassword,
        RoleId: roleId,
        Avatar: avatar,
        Code: code || normalizedCode,
        RefreshToken: "",
        CreatedDate: new Date(),
        CreatedBy: req.user?.UserId || "system"
      });

      // Xóa thông tin nhạy cảm trước khi trả về
      const userData = {
        UserId: newUser.UserId,
        EmployeeCode: newUser.EmployeeCode,
        Email: newUser.Email,
        Username: newUser.Username,
        RoleId: newUser.RoleId,
        Avatar: newUser.Avatar,
        CreatedDate: newUser.CreatedDate
      };

      // Log hành động tạo user
      console.log(`User created: ${userData.UserId} by ${req.user?.UserId || "system"}`);

      return res.status(201).json({
        status: 201,
        message: "Tạo người dùng thành công",
        data: userData
      });
    } catch (error: any) {
      console.error("Error in createUser:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Đã xảy ra lỗi khi tạo người dùng",
        data: null
      });
    }
  },

  // Cập nhật thông tin user
  updateUser: async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const { 
        email, 
        username, 
        password, 
        roleId, 
        avatar,
        code
      } = req.body;

      // Tìm user cần cập nhật
      const user = await Users.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Không tìm thấy người dùng",
          data: null
        });
      }

      // Chuẩn bị dữ liệu cập nhật
      const updateData: any = {};
      
      if (email) updateData.Email = email;
      if (username) updateData.Username = username;
      if (roleId) updateData.RoleId = roleId;
      if (avatar) updateData.Avatar = avatar;
      if (code) updateData.Code = code;
      
      // Nếu có mật khẩu mới, thì mã hóa và cập nhật
      if (password) {
        updateData.Password = await bcrypt.hash(password, 10);
      }
      
      // Thêm thông tin cập nhật
      updateData.UpdatedDate = new Date();
      updateData.UpdatedBy = req.user?.UserId || "system";

      // Thực hiện cập nhật
      await user.update(updateData);

      // Nếu có dữ liệu trong Redis, xóa để cập nhật sau
      await redis.del(`user:${id}`);

      // Lấy dữ liệu đã cập nhật
      const updatedUser = await Users.findByPk(id, {
        attributes: { exclude: ['Password', 'RefreshToken'] }
      });

      // Log hành động cập nhật
      console.log(`User updated: ${id} by ${req.user?.UserId || "system"}`);

      return res.status(200).json({
        status: 200,
        message: "Cập nhật thông tin người dùng thành công",
        data: updatedUser
      });
    } catch (error: any) {
      console.error("Error in updateUser:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Đã xảy ra lỗi khi cập nhật thông tin người dùng",
        data: null
      });
    }
  },

  // Xóa người dùng
  deleteUser: async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      
      // Tìm user cần xóa
      const user = await Users.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          status: 404,
          message: "Không tìm thấy người dùng",
          data: null
        });
      }

      // Thực hiện xóa
      await user.destroy();

      // Xóa cache Redis
      await redis.del(`user:${id}`);

      // Log hành động xóa
      console.log(`User deleted: ${id} by ${req.user?.UserId || "system"}`);

      return res.status(200).json({
        status: 200,
        message: "Xóa người dùng thành công",
        data: null
      });
    } catch (error: any) {
      console.error("Error in deleteUser:", error);
      return res.status(500).json({
        status: 500,
        message: error.message || "Đã xảy ra lỗi khi xóa người dùng",
        data: null
      });
    }
  }
};
