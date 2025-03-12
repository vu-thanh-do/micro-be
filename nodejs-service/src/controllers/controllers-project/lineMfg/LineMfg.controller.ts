import HttpError from "../../../errors/httpError";
import express, { Request, Response } from "express";
import { Get, Post, Put, Delete, HttpCode, JsonController, Req, Res, UploadedFile, Body } from "routing-controllers";
import { inject } from "inversify";
import { UnitOfWork } from "../../../unitOfWork/unitOfWork";
import LineMfg from "../../../models/models-project/lineMfg.model";
import xlsx from "xlsx";
import multer from "multer";

// Sử dụng multer với bộ nhớ tạm
const upload = multer({ storage: multer.memoryStorage() });

@JsonController("/lineMfg")
class LineMfgController {
  private uow: UnitOfWork;

  constructor(@inject(UnitOfWork) uow: UnitOfWork) {
    this.uow = uow;
  }

  /**
   * Lấy danh sách line với phân trang và tìm kiếm theo tên
   * URL query: ?page=1&limit=10&search=abc
   */
  @Get("/getAllLineMfg")
  @HttpCode(200)
  async getAllLineMfg(@Req() request: Request, @Res() response: Response) {
    try {
      const page = parseInt(request.query.page as string) || 1;
      const limit = parseInt(request.query.limit as string) || 10;
      const search = request.query.search as string || "";
      const status = request.query.status as string || "";
      // Lọc chỉ lấy các line active
      const query: any = {};
      if (search) {
        query.nameLine = { $regex: search, $options: "i" }; // tìm kiếm không phân biệt hoa thường
      }
      if (status) {
        query.status = status;
      }
      const options = {
        page,
        limit,
        sort: { createdAt: -1 }
      };
      const result = await LineMfg.paginate(query, options);
      return response.json(result);
    } catch (error: any) {
      return response.status(500).json({
        message: "Error getting lineMfg",
        error: error.message
      });
    }
  }

  /**
   * Tạo mới line
   */
  @Post("/createLine")
  @HttpCode(201)
  async createLine(@Req() request: Request, @Res() response: Response, @Body() data: { nameLine: string }) {
    try {
      const { nameLine } = data;
      if (!nameLine) {
        return response.status(400).json({ message: "nameLine is required" });
      }
      const checkLine = await LineMfg.findOne({ nameLine });
      if (checkLine) {
        return response.status(400).json({ message: "Line already exists" });
      }
      const newLine = new LineMfg({
        nameLine,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: []
      });
      await newLine.save();
      return response.json(newLine);
    } catch (error: any) {
      return response.status(500).json({
        message: "Error creating lineMfg",
        error: error.message
      });
    }
  }

  /**
   * Cập nhật line. Nếu tên thay đổi, lưu lại tên cũ vào mảng history.
   */
  @Put("/updateLine/:id")
  @HttpCode(200)
  async updateLine(@Req() request: Request, @Res() response: Response, @Body() data: { nameLine: string }) {
    try {
      const id = request.params.id;
      const { nameLine } = data;
      if (!nameLine) {
        return response.status(400).json({ message: "nameLine is required" });
      }
      // Tìm line theo id
      const line = await LineMfg.findById(id);
      if (!line) {
        return response.status(404).json({ message: "Line not found" });
      }
      // Nếu tên thay đổi, lưu tên cũ vào history
      if (line.nameLine !== nameLine) {
        line.history.push({ nameLineBefore: line.nameLine, updatedAt: new Date() });
      }
      line.nameLine = nameLine;
      line.updatedAt = new Date();
      await line.save();
      return response.json(line);
    } catch (error: any) {
      return response.status(500).json({
        message: "Error updating lineMfg",
        error: error.message
      });
    }
  }

  /**
   * Xoá line: không xóa hoàn toàn mà chỉ update status = false (inactive)
   */
  @Post("/toggleLine/:id")
  @HttpCode(200)
  async toggleLine(@Req() request: Request, @Res() response: Response) {
    try {
      const { id } = request.params;
      const line = await LineMfg.findById(id);
      if (!line) {
        return response.status(404).json({ message: "Line not found" });
      }
      // Toggle trạng thái: nếu true thì chuyển false, ngược lại
      line.status = !line.status;
      line.updatedAt = new Date();
      await line.save();
      const statusText = line.status ? "active" : "inactive";
      return response.json({ message: `Line marked as ${statusText}`, line });
    } catch (error: any) {
      return response.status(500).json({
        message: "Error toggling lineMfg",
        error: error.message
      });
    }
  }

  /**
   * Import Excel để thêm và cập nhật line.
   * Dữ liệu Excel giả định có cột: nameLine
   *
   * Lưu ý: Endpoint này sử dụng middleware multer để nhận file upload.
   * Cách cấu hình trong routing-controllers có thể khác, hãy tham khảo tài liệu để tích hợp file upload.
   */
  @Get("/downloadTemplate")
  @HttpCode(200)
  async downloadTemplate(@Res() response: Response) {
    try {
      // Lấy dữ liệu từ model
      const lines = await LineMfg.find({status: true});
      const data = lines.map(line => ({
        _id: line._id.toString(),
        name: line.nameLine,
        "new name": ""
      }));

      data.push({ _id: "", name: "", "new name": "" });
      
      const ws = xlsx.utils.json_to_sheet(data, { header: ["_id", "name", "new name"] });
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Template");
      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
      response.setHeader("Content-Disposition", "attachment; filename=template.xlsx");
      response.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return response.send(buffer);
    } catch (error: any) {
      return response.status(500).json({
        message: "Error generating template file",
        error: error.message,
      });
    }
  }
  @Post("/importExcel")
  @HttpCode(200)
  async importExcel(
    @UploadedFile("file") file: Express.Multer.File,
    @Req() request: Request,
    @Res() response: Response
  ) {
    try {
      if (!file) {
        return response.status(400).json({ message: "No file uploaded" });
      }
      const workbook = xlsx.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet) as { _id?: string, name?: string, "new name"?: string }[];

      for (const row of jsonData) {
        const id = row._id ? row._id.toString().trim() : "";
        const name = row.name ? row.name.toString().trim() : "";
        const newName = row["new name"] ? row["new name"].toString().trim() : "";

        if (id) {
          // Nếu có _id, tìm record theo _id
          const line = await LineMfg.findById(id);
          if (line) {
            // Nếu có newName thì đổi tên và lưu lịch sử
            if (newName && line.nameLine !== newName) {
              line.history.push({ nameLineBefore: line.nameLine, updatedAt: new Date() });
              line.nameLine = newName;
              line.updatedAt = new Date();
              await line.save();
            }
            // Nếu newName trống thì giữ nguyên
          }
          // Nếu không tìm thấy record theo _id, bạn có thể bỏ qua hoặc log thông báo lỗi tùy yêu cầu
        } else {
          // Nếu không có _id, tạo mới nếu có giá trị ở cột name
          if (name) {
            const newLine = new LineMfg({
              nameLine: name,
              status: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              history: []
            });
            await newLine.save();
          }
        }
      }
      return response.json({ message: "Excel data imported successfully" });
    } catch (error: any) {
      return response.status(500).json({
        message: "Error importing excel data",
        error: error.message,
      });
    }
  }
}

export default LineMfgController;
