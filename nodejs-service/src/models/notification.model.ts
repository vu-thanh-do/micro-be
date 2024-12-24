import mongoose, { Model } from "mongoose";
import { INoti } from "../interface/noti.type";

const NotificationSchema = new mongoose.Schema({
  message: String,
  userId: String,
  date: { type: Date, default: Date.now },
});

const Notification: Model<INoti> = mongoose.model<INoti>(
  "Notification",
  NotificationSchema
);

export default Notification;
