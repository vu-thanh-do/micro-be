import HttpError from "../../../errors/httpError";
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
import { LoggerService } from "../../../services/services/logger.service";
import { inject, injectable } from "inversify";
import { ILogger } from "../../../types/logs.type";
import { CodeApprovalService } from "../../../services/services/codeApproval.service";
import { ICodeApproval } from "../../../types/codeApproval.type";
@JsonController("/codeApproval")
class CodeApprovalController {
  private codeApprovalService: CodeApprovalService;
  private uow: UnitOfWork;
  constructor(
    @inject(CodeApprovalService) codeApprovalService: CodeApprovalService,
    @inject(UnitOfWork) uow: UnitOfWork
  ) {
    this.codeApprovalService = codeApprovalService;
    this.uow = uow;
  }
  @Get("/")
  @HttpCode(200)
  async getAllCodeApproval(@Req() request: Request, @Res() response: Response) {
    console.log(this.codeApprovalService);
    const dataCodeApproval = await this.codeApprovalService.getAll();
    return response.send(dataCodeApproval);
  }
  @Post("/create")
  @HttpCode(201)
  async createCodeApproval(
    @Req() request: Request,
    @Res() response: Response,
    @Body() data: ICodeApproval
  ) {
    try {
      console.log(this.uow,'this.uow')
      const sessionStart: any = await this.uow.start();
      console.log(sessionStart,'sessionStart'); // Kiểm tra xem session có hợp lệ không
      if (!sessionStart) {
        throw new Error("Session failed to start");
      }
      console.log(data,'data');
      const dataCodeApproval = await this.codeApprovalService.create(
        data,
        this.uow,
        sessionStart
      ); // Gọi đến service 
      await this.uow.commit(); // Commit transaction vào CSDL
      console.log("Transaction committed successfully");
      return response.send({
        message: "code approval created successfully!",
        status: 201,
        data: dataCodeApproval,
      });
    } catch (error :any) {
      console.error("Error occurred, rolling back", error);
      await this.uow.rollback(); // Rollback transaction nếu có lỗi
      console.error("roll back ok");
      throw new HttpError(error.message, 500);
    }
  }
}

export default CodeApprovalController;
