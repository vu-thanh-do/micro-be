import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

const connectRedis = () => {
  const redis = new Redis({
    host: process.env.HOST_REDIS,
    port: Number(process.env.PORT_REDIS),
    password: process.env.PASSWORD_REDIS,
  });

  redis.ping()
    .then(() => console.log("✅ Redis connected successfully!"))
    .catch((err) => console.error("❌ Redis connection error:", err));

  return redis; 
};
export default connectRedis;
