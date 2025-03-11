import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
interface IUser {
  UserId: string;
  username: string;
  role: string;
}
export const generateToken = (user: IUser) => {
  return jwt.sign(
    { UserId: user.UserId, username: user.username, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "2m" }
  );
};

export const generateRefreshToken = (user: IUser) => {
  return jwt.sign(
    { UserId: user.UserId, username: user.username, role: user.role },
    process.env.SECRET_REFRESH as string,
    {
      expiresIn: "10m",
    }
  );
};
