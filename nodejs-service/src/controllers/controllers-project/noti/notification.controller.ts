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
  Param,
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
  @Get("/admin")
  @HttpCode(200)
  async getNotiAdmin(@Req() request: Request, @Res() response: Response) {
    try {
      const page = parseInt(request.query.page as string) || 1; 
      const limit = parseInt(request.query.limit as string) || 10;
      
      const dataNoti = await this.notiService.getNotifications(
        { role: "ADMIN" }, 
        {
          page,
          limit,
          sort: { createdAt: -1 }
        }
      );

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách thông báo thành công",
        data: dataNoti.docs,
        pagination: {
          totalDocs: dataNoti.totalDocs,
          limit: dataNoti.limit,
          totalPages: dataNoti.totalPages,
          page: dataNoti.page,
          hasPrevPage: dataNoti.hasPrevPage,
          hasNextPage: dataNoti.hasNextPage,
          prevPage: dataNoti.prevPage,
          nextPage: dataNoti.nextPage
        }
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy danh sách thông báo",
        error: error.message
      });
    }
  }
  @Get("/users/:userId")
  @HttpCode(200)
  async getNotificationsByRole(

    @Param("userId") userId: string,
    @Req() req: Request,
    @Res() response: Response
  ) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const isRead = req.query.isRead as string;

      const filter: any = {
        userId: userId
      };

      if (isRead) {
        filter.isRead = isRead === 'true';
      }

      const options = {
        page,
        limit,
        sort: { createdAt: -1 }
      };

      const result = await this.notiService.getNotifications(filter, options);

      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách thông báo thành công",
        data: result.docs,
        pagination: {
          totalDocs: result.totalDocs,
          limit: result.limit,
          totalPages: result.totalPages,
          page: result.page,
          hasPrevPage: result.hasPrevPage,
          hasNextPage: result.hasNextPage,
          prevPage: result.prevPage,
          nextPage: result.nextPage
        }
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy danh sách thông báo",
        error: error.message
      });
    }
  }
  @Post("/mark-read/:id")
  @HttpCode(200)
  async markAsRead(@Param("id") id: string, @Res() response: Response) {
    try {
      const sessionStart = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }

      const notification = await this.notiService.markAsRead(id, sessionStart);
      await this.uow.commit();

      return response.status(200).json({
        status: 200,
        message: "Đã đánh dấu thông báo là đã đọc",
        data: notification
      });
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi đánh dấu thông báo",
        error: error.message
      });
    }
  }
  @Post("/mark-all-read/:userId")
  @HttpCode(200)
  async markAllAsRead(@Param("userId") userId: string, @Res() response: Response) {
    try {
      const sessionStart = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }

      await this.notiService.markAllAsRead(userId, sessionStart);
      await this.uow.commit();

      return response.status(200).json({
        status: 200,
        message: "Đã đánh dấu tất cả thông báo là đã đọc"
      });
    } catch (error: any) {
      await this.uow.rollback();
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi đánh dấu thông báo",
        error: error.message
      });
    }
  }
  @Get("/unread-count/:userId")
  @HttpCode(200)
  async getUnreadCount(@Param("userId") userId: string, @Res() response: Response) {
    try {
      const count = await this.notiService.getUnreadCount(userId);

      return response.status(200).json({
        status: 200,
        message: "Lấy số lượng thông báo chưa đọc thành công",
        data: { count }
      });
    } catch (error: any) {
      return response.status(500).json({
        status: 500,
        message: "Đã xảy ra lỗi khi lấy số lượng thông báo chưa đọc",
        error: error.message
      });
    }
  }
}

export default NotificationController;
