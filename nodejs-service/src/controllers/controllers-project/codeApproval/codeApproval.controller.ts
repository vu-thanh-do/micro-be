import HttpError from "../../../errors/httpError";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import express, { Request, Response } from "express";
import {
  Body,
  Get,
  HttpCode,
  JsonController,
  Post,
  Put,
  Req,
  Res,
} from "routing-controllers";
import { LoggerService } from "../../../services/services/logger.service";
import { inject, injectable } from "inversify";
import { ILogger } from "../../../types/logs.type";
import { CodeApprovalService } from "../../../services/services/codeApproval.service";
import {
  ICodeApproval,
  IUpdateCodeApproval,
} from "../../../types/codeApproval.type";
import { ResponseDataService } from "../../../services/services/response.service";
@JsonController("/codeApproval")
class CodeApprovalController {
  private codeApprovalService: CodeApprovalService;
  private uow: UnitOfWork;
  private responseDataService: ResponseDataService;
  constructor(
    @inject(CodeApprovalService) codeApprovalService: CodeApprovalService,
    @inject(UnitOfWork) uow: UnitOfWork,
    @inject(ResponseDataService) responseDataService: ResponseDataService
  ) {
    this.codeApprovalService = codeApprovalService;
    this.uow = uow;
    this.responseDataService = responseDataService;
  }
  @Get("/")
  @HttpCode(200)
  async getAllCodeApproval(@Req() request: Request, @Res() response: Response) {
    const dataCodeApproval = await this.codeApprovalService.getAll();
    return response.send(
      this.responseDataService.createResponse(200, dataCodeApproval, "success")
    );
  }
  @Get("/get-by-id/:id")
  @HttpCode(200)
  async getCodeApprovalById(
    @Req() request: Request,
    @Res() response: Response
  ) {
    const { id } = request.params;
    const dataCodeApproval = await this.codeApprovalService.getById(id);
    return response.send(
      this.responseDataService.createResponse(200, dataCodeApproval, "success")
    );
  }
  @Post("/create")
  @HttpCode(201)
  async createCodeApproval(
    @Req() request: Request,
    @Res() response: Response,
    @Body() data: ICodeApproval
  ) {
    try {
      console.log(this.uow, "this.uow");
      const sessionStart: any = await this.uow.start();
      console.log(sessionStart, "sessionStart"); // Kiểm tra xem session có hợp lệ không
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      console.log(data, "data");
      const dataCodeApproval = await this.codeApprovalService.create(
        data,
        this.uow,
        sessionStart
      ); // Gọi đến service
      await this.uow.commit(); // Commit transaction vào CSDL
      console.log("Transaction committed successfully");
      return response.send(
        this.responseDataService.createResponse(
          201,
          dataCodeApproval,
          "code approval created successfully!"
        )
      );
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      throw new HttpError(error.message, 500);
    }
  }
  @Put("/update-status/:id")
  @HttpCode(200)
  async updateStatusCodeApproval(
    @Req() request: Request,
    @Res() response: Response,
    @Body() data: ICodeApproval
  ) {
    try {
      const { id } = request.params;
      console.log(data, "this.uow");
      const sessionStart: any = await this.uow.start();

      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      const dataCodeApproval = await this.codeApprovalService.update(
        id,
        data,
        this.uow
      ); // Gọi đến service
      await this.uow.commit(); // Commit transaction vào CSDL
      return response.send(
        this.responseDataService.createResponse(
          200,
          dataCodeApproval,
          "code approval updated successfully!"
        )
      );
    } catch (error: any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      throw new HttpError(error.message, 500);
    }
  }
}

export default CodeApprovalController;
