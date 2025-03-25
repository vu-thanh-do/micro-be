import { CompanySyncService } from "../../../services/services/companySync.service";
import { injectable, inject } from "inversify";
import { Get, HttpCode, JsonController, QueryParam, Req, Res } from "routing-controllers";
import { ResponseDataService } from "../../../services/services/response.service";
import { Request, Response } from "express";
import connectRedis from "../../../config/redisDB";
import redis from "../../../config/redisClient";
@injectable()
@JsonController("/sync-company-structure")
export class SyncCompanyStructureController {
  private companySyncService: CompanySyncService;
  private responseDataService: ResponseDataService;
  constructor(
    @inject(CompanySyncService) companySyncService: CompanySyncService,
    @inject(ResponseDataService) responseDataService: ResponseDataService
  ) {
    this.companySyncService = companySyncService;
    this.responseDataService = responseDataService;
  }
  @Get("/")
  @HttpCode(200)
  async syncCompanyStructure(@Req() request: Request, @Res() response: Response) {
    try {
      // 🔥 Xóa toàn bộ cache liên quan
      const keys = await redis.keys("companyStructure:*");
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🧹 Đã xóa ${keys.length} key Redis`);
      }
      // Tiến hành sync SQL → Mongo
      const data = await this.companySyncService.syncCompanyStructureFromSQL();
      return response.send(
        this.responseDataService.createResponse(200, data, "success")
      );
    } catch (error) {
      return response.send(
        this.responseDataService.createResponse(500, error, "error")
      );
    }
  }

  @Get("/search")
  @HttpCode(200)
  async search(@QueryParam("name") name: string, @Res() response: Response) {
    try {
      if (!name) return response.status(400).json({ message: "Thiếu tên phòng ban" });

      const cacheKey = `companyStructure:search:${name.toLowerCase()}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("✅ Cache hit (search)");
        return response.json(JSON.parse(cached));
      }

      const data = await this.companySyncService.findDepartmentWithHierarchy(name);
      if (!data) return response.status(404).json({ message: "Không tìm thấy phòng ban" });

      await redis.set(cacheKey, JSON.stringify(data)); // ❗ không đặt TTL → lưu vĩnh viễn
      console.log("📦 Cache set (search)");

      return response.json({
        message: "Thành công",
        ...data
      });
    } catch (error) {
      console.error("Lỗi search phòng ban:", error);
      return response.status(500).json({ message: "Lỗi server", error });
    }
  }

  @Get("/all")
  @HttpCode(200)
  async getAllDepartment(
    @QueryParam("page") page: number,
    @QueryParam("limit") limit: number,
    @Res() response: Response
  ) {
    try {
      const cacheKey = `companyStructure:page=${page || 1}&limit=${limit || 10}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("✅ Cache hit");
        return response.json(JSON.parse(cached));
      }
      const data = await this.companySyncService.getAllDepartment({ page, limit });
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60 * 60 * 24); // TTL: 24h
      console.log("📦 Cache set");
      return response.json(data);
    } catch (error) {
      console.error("❌ Lỗi lấy danh sách phòng ban:", error);
      return response.status(500).json({ message: "Lỗi server", error });
    }
  }
}
