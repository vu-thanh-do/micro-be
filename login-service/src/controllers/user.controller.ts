import { Request, Response } from "express";
import { redis } from "../config/redis";
import Users from "../model/user.model";
import jwt from "jsonwebtoken";
import { apiGetInfoUserEzV4 } from "../config/axios";

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
  getOneFromToken: async (req: Request, res: Response): Promise<any> => {
    try {
      const { token } = req.params;
      const userData = await redis.get(`token:${token}`);
      if (userData) {
        return res.status(200).json({
          status: 200,
          data: JSON.parse(userData),
          message: "success",
        });
      } else {
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        );
        const userId = decoded.UserId;
        if (!userId) {
          return res.status(400).json({
            status: 400,
            data: null,
            message: "Token không hợp lệ!",
          });
        }
        const user = await Users.findByPk(userId);
        if (!user) {
          return res.status(400).json({
            status: 400,
            data: null,
            message: "Token không hợp lệ hoặc user không tồn tại !",
          });
        }
        const dataSaveRedis = {
          UserId: user.UserId,
          Username: user.Username,
          Email: user.Email,
          RoleId: user.RoleId,
          Avatar: user.Avatar,
        };
        await redis.set(
          `token:${token}`,
          JSON.stringify(dataSaveRedis),
          "EX",
          3600
        );
        return res.status(200).json({
          status: 200,
          data: dataSaveRedis,
          message: "success",
        });
      }
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
};
