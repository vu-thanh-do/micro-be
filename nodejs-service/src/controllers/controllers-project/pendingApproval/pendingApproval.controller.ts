import {
  Get,
  HttpCode,
  JsonController,
  QueryParams,
  Body,
  Post,
  Put,
  Param,
  Res,
} from "routing-controllers";
import { inject } from "inversify";
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PendingApprovalService } from "../../../services/services/pendingApproval.service";
import { Response } from "express";
class PaginationQuery {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
class CreatePendingApprovalDto {
  @IsMongoId()
  requestId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  level?: number;

  @IsOptional()
  @IsEnum(["pending", "approved", "rejected"])
  status?: "pending" | "approved" | "rejected";
}
class UpdateStatusDto {
  @IsMongoId()
  requestId!: string;
  @IsString()
  @IsNotEmpty()
  userId!: string;
  @IsEnum(["approved", "rejected"])
  status!: "approved" | "rejected";
}

@JsonController("/pendingApproval")
export class PendingApprovalController {
  private readonly pendingService: PendingApprovalService;

  constructor(
    @inject(PendingApprovalService) pendingService: PendingApprovalService
  ) {
    this.pendingService = pendingService;
  }

  @Get("/admin")
  @HttpCode(200)
  async getAllForAdmin(
    @QueryParams() query: PaginationQuery,
    @Res() response: Response
  ) {
    const { page = 1, limit = 10 } = query;
    try {
      const result = await this.pendingService.getAllForAdmin(page, limit);
      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách thành công",
        data: result,
      });
    } catch (error) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy dữ liệu admin",
        error,
      });
    }
  }
  @Get("/user/:id")
  @HttpCode(200)
  async getAllForUser(
    @QueryParams() query: PaginationQuery,
    @Param("id") userId: string,
    @Res() response: Response
  ) {
    const { page = 1, limit = 10 } = query;
    try {
      const result = await this.pendingService.getAllForUser(
        userId,
        page,
        limit
      );
      return response.status(200).json({
        status: 200,
        message: "Lấy danh sách thành công",
        data: result,
      });
    } catch (error) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy dữ liệu user",
        error,
      });
    }
  }

  @Post("/create")
  @HttpCode(201)
  async create(
    @Body({ validate: true }) body: CreatePendingApprovalDto,
    @Res() response: Response
  ) {
    try {
      const result = await this.pendingService.create(body);
      return response.status(201).json({
        status: 201,
        message: "Tạo mới thành công",
        data: result,
      });
    } catch (error) {
      return response.status(500).json({
        status: 500,
        message: "Tạo mới thất bại",
        error,
      });
    }
  }

  @Put("/update-status")
  @HttpCode(200)
  async updateStatus(
    @Body({ validate: true }) body: UpdateStatusDto,
    @Res() response: Response
  ) {
    try {
      const result = await this.pendingService.updateStatus(
        body.requestId,
        body.userId,
        body.status
      );
      return response.status(200).json({
        status: 200,
        message: "Cập nhật thành công",
        data: result,
      });
    } catch (error) {
      return response.status(500).json({
        status: 500,
        message: "Cập nhật thất bại",
        error,
      });
    }
  }
}
