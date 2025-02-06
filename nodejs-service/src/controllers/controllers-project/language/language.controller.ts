import { LanguageService } from "./../../../services/services/language.service";
import HttpError from "../../../errors/httpError";
import { INoti } from "../../../types/noti.type";
import Notification from "../../../models/models-project/notification.model";
import { NotificationService } from "../../../services/services/notification.service";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import express, { Request, Response } from "express";
import {
  Body,
  Delete,
  Get,
  HttpCode,
  JsonController,
  Post,
  Put,
  Req,
  Res,
} from "routing-controllers";
import { LoggerService } from "../../../services/services/logger.service";
import { inject } from "inversify";
import { ILogger } from "../../../types/logs.type";
import { ResponseDataService } from "../../../services/services/response.service";
@JsonController("/language")
class LanguageController {
  private languageService: LanguageService;
  private responseDataService: ResponseDataService;
  private uow: UnitOfWork;

  constructor(
    @inject(LanguageService) languageService: LanguageService,
    @inject(ResponseDataService) responseDataService: ResponseDataService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) {
    this.languageService = languageService;
    this.responseDataService = responseDataService;
    this.uow = uow;
  }
  @Get("/")
  @HttpCode(200)
  async getAllLanguage(@Req() request: Request, @Res() response: Response) {
    try {
      const {
        page = 1,
        pageSize = 10,
        query = "",
        group = "",
        language = "en",
      } = request.query;
      const options = {
        page,
        pageSize,
        query,
        group,
        language,
      };
      const dataLogs = await this.languageService.getAllGroup(options);
      return response.send(
        this.responseDataService.createResponse(200, dataLogs, "success")
      );
    } catch (error) {
      return response.send(
        this.responseDataService.createResponse(500, null, "error")
      );
    }
  }
  @Get("/get-by-id/:id")
  @HttpCode(200)
  async getLanguageById(@Req() request: Request, @Res() response: Response) {
    const { id } = request.params;
    const dataLanguage = await this.languageService.getById(id);
    return response.send(
      this.responseDataService.createResponse(200, dataLanguage, "success")
    );
  }
  @Post("/create")
  @HttpCode(201)
  async createLanguage(
    @Req() request: Request,
    @Res() response: Response,
    @Body() data: any
  ) {
    try {
      console.log(this.uow, "this.uow");
      const sessionStart: any = await this.uow.start();
      console.log(sessionStart, "sessionStart"); // Kiểm tra xem session có hợp lệ không
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      console.log(data, "data");
      const dataLanguage = await this.languageService.create(
        data,
        this.uow,
        sessionStart
      ); // Gọi đến service
      await this.uow.commit(); // Commit transaction vào CSDL
      console.log("Transaction committed successfully");
      return response.send(
        this.responseDataService.createResponse(
          201,
          dataLanguage,
          "language created successfully!"
        )
      );
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      // throw new HttpError(error.message, 500);

      return response.send({
        error: error.message
      })
    }
  }
  @Put("/update/:id")
  @HttpCode(200)
  async updateLanguage(
    @Req() request: Request,
    @Res() response: Response,
    @Body() data: any
  ) {
    try {
      const { id } = request.params;
      console.log(data, "this.uow");
      const sessionStart: any = await this.uow.start();
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      const dataLanguage = await this.languageService.update(
        id,
        data,
        this.uow
      ); // Gọi đến service
      await this.uow.commit(); // Commit transaction vào CSDL
      return response.send(
        this.responseDataService.createResponse(
          200,
          dataLanguage,
          "language updated successfully!"
        )
      );
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      throw new HttpError(error.message, 500);
    }
  }
  @Delete("/delete/:id")
  @HttpCode(200)
  async removeLanguageById(@Req() request: Request, @Res() response: Response) {
    const { id } = request.params;
    const dataLanguage = await this.languageService.delete(id);
    return response.send(
      this.responseDataService.createResponse(200, "ok", "success")
    );
  }
}

export default LanguageController;
