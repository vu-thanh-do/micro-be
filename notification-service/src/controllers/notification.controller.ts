import HttpError from "../errors/httpError";
import { INoti } from "../interface/noti.type";
import Notification from "../models/notification.model";
import { NotificationService } from "../services/notification.service";
import { UnitOfWork } from "../unitOfWork/unitOfWork";
import express, { Request, Response } from "express";
import { Body, Get, HttpCode, JsonController, Post } from "routing-controllers";
@JsonController("/notifications")
class NotificationController {
  private notiService: NotificationService;

  constructor() {
    this.notiService = new NotificationService();
  }
  @Post("/create")
  @HttpCode(201)
  async createNotification(@Body() data: Omit<INoti, "_id">) {
    const uow = new UnitOfWork();
    try {
      await uow.start();
      const dataNoti = await this.notiService.createNoti(data, uow); // Gọi đến service để tạo notification
      await uow.commit(); // Commit transaction vào CSDL
      console.log("Transaction committed successfully");
      return {
        message: "Notification created successfully!",
        status: 201,
        data: dataNoti,
      };
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      throw new HttpError(error.message, 500);
    }
  }
  @Get("/")
  @HttpCode(200)
  async getNoti(req: Request, res: Response) {
    const dataNoti = await this.notiService.getAllNotis();
    return res.json(dataNoti);
  }
}

export default NotificationController;
