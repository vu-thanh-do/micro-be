import { INoti } from "../interface/noti.type";
import Notification from "../models/notification.model";
import { NotiRepository } from "../repositories/noti.repository";
import { UnitOfWork } from "../unitOfWork/unitOfWork";
export class NotificationService {
  private notiRepository: NotiRepository;

  constructor() {
    this.notiRepository = new NotiRepository();
  }
  async getAllNotis(): Promise<INoti[]> {
    return this.notiRepository.getAll();
  }

  async getNotiById(id: string): Promise<INoti | null> {
    return this.notiRepository.getById(id);
  }

  async createNoti(data: Partial<INoti>, uow: UnitOfWork): Promise<INoti> {
    const notificationRepo = uow.registerRepository(Notification);
    return notificationRepo.create(data);
  }

  async updateNoti(
    id: string,
    data: Partial<INoti>,
    uow?: UnitOfWork
  ): Promise<INoti | null> {
    if (uow) {
      const notificationRepo = uow.registerRepository(Notification);
      return notificationRepo.update(id, data);
    } else {
      return this.notiRepository.update(id, data);
    }
  }

  async deleteNoti(id: string): Promise<INoti | null> {
    return this.notiRepository.delete(id);
  }
}
