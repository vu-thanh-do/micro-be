import mongoose from "mongoose";
import { config } from "./index.js";
const connectDb = () => {
  mongoose
    .connect(config.mongoUri)
    .then(() => console.log("✅ Database connected!"))
    .catch((err) => console.log(err));
};
export default connectDb;
