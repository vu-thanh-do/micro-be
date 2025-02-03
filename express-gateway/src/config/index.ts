import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  services: {
    serviceA: process.env.SERVICE_A_URL || "http://localhost:4001",
    serviceB: process.env.SERVICE_B_URL || "http://localhost:4002",
    fileService: process.env.SERVICE_FILE_URL
  },
};
