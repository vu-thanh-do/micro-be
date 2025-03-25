import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.HOST_REDIS,
  port: Number(process.env.PORT_REDIS),
  password: process.env.PASSWORD_REDIS,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error", err));

export default redis;
