import mongoose, { Model } from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import { INoti } from "../../types/noti.type";

const NotificationSchema = new mongoose.Schema({
  // Thông tin cơ bản của thông báo
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  // Loại thông báo
  type: { 
    type: String, 
    required: true 
  },

  // Thông tin người nhận thông báo
  userId: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true 
  },

  // Thông tin yêu cầu liên quan
  requestId: { 
    type: String, 
    required: true 
  },
  requestType: { 
    type: String, 
    required: true 
  },

  // Trạng thái đọc của thông báo
  isRead: { 
    type: Boolean, 
    default: false 
  },

  // Thông tin chi tiết bổ sung
  metadata: {
    requestTitle: String,
    requesterName: String,
    requesterCode: String,
    approvalLevel: Number,
    actionBy: {
      name: String,
      code: String
    },
    link: String
  },

  // Thông tin thời gian
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  versionKey: false
});

// Thêm plugin phân trang
NotificationSchema.plugin(mongoosePaginate);

// Tạo index để tối ưu truy vấn
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ requestId: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INoti> = mongoose.model<INoti>("Notification", NotificationSchema);
export default Notification;
