import axios from "axios";
import { Request, Response } from "express";
import { signInSchema } from "../schema/login.schema";
import Users from "../model/user.model";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid"; // Import phương thức v4 từ uuid
import { generateRefreshToken, generateToken } from "../config/token";
import { redis } from "../config/redis";
dotenv.config();

export const AuthController = {
  LoginFirstTime: async (employeeCode: string, password: string) => {
    try {
      const checkCode = employeeCode.toLowerCase().includes("j");
      const dataLoginByAd = await axios.post(
        process.env.API_LOGIN_AD as string,
        {
          employeeCode: checkCode ? employeeCode : "vn" + employeeCode,
          password,
          isFullProfile: false,
        }
      );
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserData = {
        UserId: uuidv4(),
        EmployeeCode: dataLoginByAd.data.data.employeeId,
        Avatar: "image/male.jpg",
        Email: dataLoginByAd.data.data.email,
        Username: dataLoginByAd.data.data.fullName,
        RoleId: "29E26E83-7721-4516-8E9A-F5D02DEE22D0",
        Password: hashedPassword,
        RefreshToken: "",
        Code: dataLoginByAd.data.data.employeeId,
        CreatedDate: new Date(),
      };
      const newUser = await Users.create(newUserData);
      const token = generateToken({
        UserId: newUser.UserId,
        username: newUserData.Username,
        role: newUserData.RoleId,
      });
      const refreshToken = generateRefreshToken({
        UserId: newUser.UserId,
        username: newUserData.Username,
        role: newUserData.RoleId,
      });
      const dataSaveRedis = {
        UserId: newUser.UserId,
        Username: newUser.Username,
        Email: newUser.Email,
        RoleId: newUser.RoleId,
        Avatar: newUser.Avatar,
      };
      await redis.hmset(`user:${newUser.UserId}`, dataSaveRedis);
      await redis.expire(`user:${newUser.UserId}`, 3600);
      await redis.set(
        `token:${token}`,
        JSON.stringify(dataSaveRedis),
        "EX",
        3600
      );
      return {
        status: 200,
        message: "Successfully",
        data: { token: token },
      };
    } catch (error: any) {
      if (error?.response?.data?.error_code == 403) {
        return {
          status: 403,
          message: error?.response?.data?.error_message,
          data: null,
        };
      } else {
        return {
          status: 500,
          message: "Error , Please check your account and password again !",
          data: null,
          error: error,
        };
      }
    }
  },
  VerifyByAd: async (employeeCode: string, password: string, user: any) => {
    const checkCode = employeeCode.toLowerCase().includes("j");
    try {
      const verifyByAd = await axios.post(process.env.API_LOGIN_AD as string, {
        employeeCode: checkCode ? employeeCode : "vn" + employeeCode,
        password,
        isFullProfile: false,
      });
      if (verifyByAd.data.result == 1) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await Users.update(
          { Password: hashedPassword },
          {
            where: {
              UserId: user.UserId,
            },
          }
        );
        const token = generateToken({
          UserId: user.UserId,
          username: user.Username,
          role: user.RoleId,
        });
        const refreshToken = generateRefreshToken({
          UserId: user.UserId,
          username: user.Username,
          role: user.RoleId,
        });
        const dataSaveRedis = {
          UserId: user.UserId,
          Username: user.Username,
          Email: user.Email,
          RoleId: user.RoleId,
          Avatar: user.Avatar,
        };
        await redis.hmset(`user:${user.UserId}`, dataSaveRedis);
        await redis.expire(`user:${user.UserId}`, 3600);
        await redis.set(
          `token:${token}`,
          JSON.stringify(dataSaveRedis),
          "EX",
          3600
        );
        return {
          status: 200,
          message: "Successfully",
          data: { token: token },
        };
      }
    } catch (error: any) {
      if (error?.response?.data?.error_code == 403) {
        return {
          status: 403,
          message: error?.response?.data?.error_message,
          data: null,
        };
      } else {
        return {
          status: 500,
          message: "Error , Please check your account and password again !",
          data: null,
          error: error,
        };
      }
    }
  },
  Login: async (req: Request, res: Response): Promise<any> => {
    try {
      const { employeeCode, password } = req.body;
      const { error } = signInSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const errors = error.details.map((error) => error.message);
        return res.status(400).json({
          message: errors[0],
        });
      }
      const newCode = employeeCode.replace(/dmvn|vn/g, "");
      const checkExistUser = await Users.findOne({
        where: { EmployeeCode: newCode },
      });
      if (!checkExistUser) {
        const dataLoginByAd = await AuthController.LoginFirstTime(
          newCode,
          password
        );
        res.cookie("refreshToken", dataLoginByAd.data?.token, {
          httpOnly: true,
          secure: false,
          path: "/",
          sameSite: "strict",
        });
        return res.status(200).json(dataLoginByAd);
      } else {
        console.log(1);
        const dataVerifyAd = await AuthController.VerifyByAd(
          newCode,
          password,
          checkExistUser
        );
        console.log(dataVerifyAd, "dataVerifyAd");
        return res.status(200).json(dataVerifyAd);
      }
    } catch (error: any) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
};
