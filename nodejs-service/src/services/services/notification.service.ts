import { INoti } from "../../types/noti.type";
import Notification from "../../models/models-project/notification.model";
import { NotiRepository } from "../../repositories/noti.repository";
import { UnitOfWork } from "../../unitOfWork/unitOfWork";
import { GenericService } from "./generic.service";
import { injectable } from "inversify";
@injectable()
export class NotificationService extends GenericService<INoti> {
  constructor() {
    super(Notification)
  }

  async create(data: INoti, uow: UnitOfWork, session: any) {
    try {
      const notification = new Notification({
        title: data.title,
        content: data.content,
        type: data.type,
        userId: data.userId,
        role: data.role,
        requestId: data.requestId,
        requestType: data.requestType,
        isRead: data.isRead,
        metadata: {
          requestTitle: data.metadata?.requestTitle,
          requesterName: data.metadata?.requesterName,
          requesterCode: data.metadata?.requesterCode,
          approvalLevel: data.metadata?.approvalLevel,
          actionBy: data.metadata?.actionBy,
          link: data.metadata?.link
        }
      });

      const result = await notification.save({ session });
      return result;
    } catch (error) {
      console.error("Error in NotificationService.create:", error);
      throw error;
    }
  }

  async getNotifications(filter: any, options: any) {
    return await (Notification as any).paginate(filter, options);
  }

  async markAsRead(id: string, session: any) {
    return await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true, session }
    );
  }

  async markAllAsRead(userId: string, session: any) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true },
      { session }
    );
  }

  async getUnreadCount(userId: string) {
    return await Notification.countDocuments({ userId, isRead: false });
  }
}
