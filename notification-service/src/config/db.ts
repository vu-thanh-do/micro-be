import mongoose from "mongoose";
import { config } from ".";
const connectDb = () => {
  mongoose
    .connect(config.mongoUri, {
      replicaSet: "myReplicaSet", // Đảm bảo bạn chỉ định đúng tên replica set
      readPreference: "primaryPreferred", // Hoặc 'nearest', tùy vào yêu cầu của bạn
    })
    .then(() => console.log("Database connected!"))
    .catch((err) => console.log(err));
};
export default connectDb;
