import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4001,
  mongoUri:
    process.env.MONGODB_CONNECT_URL ||
    "mongodb://localhost:27017/notifications",
};
