import HttpError from "../../../errors/httpError";
import { INoti } from "../../../types/noti.type";
import { NotificationService } from "../../../services/services/notification.service";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import express, { Request, Response } from "express";
import {
  Body,
  Get,
  HttpCode,
  JsonController,
  Post,
  Req,
  Res,
} from "routing-controllers";
import { inject, injectable } from "inversify";
@JsonController("/notifications")
class NotificationController {
  private notiService: NotificationService;
  private uow: UnitOfWork;
  constructor(
    @inject(NotificationService) notiService: NotificationService,
    @inject(UnitOfWork) uow : UnitOfWork  
  ) {
    this.notiService = notiService;
    this.uow = uow;
  }
  @Post("/create")
  @HttpCode(201)
  async createNotification(@Body() data: INoti, @Res() response: Response) {
    // const uow = new UnitOfWork();
    try {
      console.log(this.uow,'this.uow')
      const sessionStart: any = await this.uow.start();

      console.log(sessionStart,'sessionStart'); // Kiểm tra xem session có hợp lệ không
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      const dataNoti = await this.notiService.create(
        data,
        this.uow,
        sessionStart
      ); // Gọi đến service để tạo notification
      await this.uow.commit(); // Commit transaction vào CSDL
      console.log("Transaction committed successfully");
      return response.send({
        message: "Notification created successfully!",
        status: 201,
        data: dataNoti,
      });
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      throw new HttpError(error.message, 500);
    }
  }
  @Get("/")
  @HttpCode(200)
  async getNoti(@Req() request: Request, @Res() response: Response) {
    const dataNoti = await this.notiService.getAll();
    return response.send(dataNoti);
  }
}

export default NotificationController;
