import axios from "axios";
import { Request, Response } from "express";
import { signInSchema } from "../schema/login.schema";
import Users from "../model/user.model";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid"; // Import phương thức v4 từ uuid
import { generateRefreshToken, generateToken } from "../config/token";
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
          isFullProfile: true,
        }
      );
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserData = {
        UserId: uuidv4(), // Tạo GUID cho UserId
        EmployeeCode: dataLoginByAd.data.data.employeeId,
        Avatar: "image/male.jpg",
        Email: dataLoginByAd.data.data.email,
        Username: dataLoginByAd.data.data.fullName,
        RoleId: "29E26E83-7721-4516-8E9A-F5D02DEE22D0",
        Password: hashedPassword,
        RefreshToken: "2323",
        Code: "312312",
        CreatedDate: new Date(),
      };
      console.log(newUserData, "before login");
      const newUser = await Users.create(newUserData);
      console.log("User inserted:", newUser);
      console.log(newUser, "newUser");
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
  VerifyByAd: async (employeeCode: string, password: string) => {},
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
      }
      return res.status(200).json({
        ok: checkExistUser,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
};
