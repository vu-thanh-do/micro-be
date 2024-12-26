import mongoose, { Model } from "mongoose";
import { INoti } from "../types/noti.type";
import mongoosePaginate from 'mongoose-paginate-v2';

const NotificationSchema = new mongoose.Schema({
  message: String,
  userId: String,
  date: { type: Date, default: Date.now },
},
{
  timestamps: true,
  versionKey: false,
});
NotificationSchema.plugin(mongoosePaginate);
const Notification: Model<INoti> = mongoose.model<INoti>(
  "Notification",
  NotificationSchema
);
export default Notification;
