import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import Users from "../model/user.model";

dotenv.config();

interface CustomRequest extends Request {
  user?: any;
}

interface TokenPayload extends JwtPayload {
  UserId: string;
}

export const authMiddleware = {
  verifyToken: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token is missing" });
      }
      const token = authHeader.split(" ")[1];
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }
      let decoded: TokenPayload;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
      } catch (err: any) {
        // Không tiết lộ chi tiết lỗi JWT cho client
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token has expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
      }
      // Tìm user trong cơ sở dữ liệu, loại bỏ trường nhạy cảm như password
      const user = await Users.findByPk(decoded.UserId)
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      req.user = user;
      next();
    } catch (error: any) {
      console.error("Authentication error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  verifyTokenAdmin: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    // Sử dụng middleware verifyToken trước, sau đó kiểm tra quyền admin
    authMiddleware.verifyToken(req, res, () => {
      if (req.user && req.user.role === "admin") {
        return next();
      } else {
        return res
          .status(403)
          .json({ message: "You are not allowed to access this resource" });
      }
    });
  },
};
