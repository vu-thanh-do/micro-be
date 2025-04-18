import { Request, Response } from "express";
import {
  Get,
  HttpCode,
  JsonController,
  Res,
  Req,
  QueryParams,
} from "routing-controllers";
import { HistoryApprovalService } from "../../../services/services/historyApproval.service";
import { inject } from "inversify";

class HistoryApprovalQuery {
  page?: number;
  limit?: number;
  status!: "approved" | "rejected";
  recCode?: string;
  requestStatus?: string;
  fromDate?: string;
  toDate?: string;
}

@JsonController("/history-approve")
export default class HistoryApprovalController {
  private readonly historyService: HistoryApprovalService;
  constructor(
    @inject(HistoryApprovalService) historyService: HistoryApprovalService
  ) {
    this.historyService = historyService;
  }
  @Get("/")
  @HttpCode(200)
  async getHistoryApproval(
    @Req() request: Request,
    @Res() response: Response,
    @QueryParams() query: HistoryApprovalQuery
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      recCode,
      requestStatus,
      fromDate,
      toDate,
    } = query;
    const userId = request.query.userId as string; // hoặc từ req.user nếu đã có auth middleware

    if (!userId || !status) {
      return response.status(400).json({
        status: 400,
        message: "Thiếu userId hoặc trạng thái lịch sử",
      });
    }

    try {
      const result = await this.historyService.getUserApprovalHistory(
        userId,
        status,
        recCode,
        requestStatus,
        fromDate ? new Date(fromDate) : undefined,
        toDate ? new Date(toDate) : undefined,
        page,
        limit
      );
      return response.status(200).json({
        status: 200,
        message: "Lấy lịch sử phê duyệt thành công",
        data: result,
      });
    } catch (error) {
      return response.status(500).json({
        status: 500,
        message: "Lỗi khi lấy lịch sử phê duyệt",
        error,
      });
    }
  }
}
