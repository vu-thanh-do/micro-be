import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongoUri:
    process.env.MONGODB_CONNECT_URL ||
    "mongodb://localhost:27017/notifications",
};
