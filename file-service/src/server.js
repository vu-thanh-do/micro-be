import express from "express";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import connectDb from "./conf/db.conf.js";

dotenv.config();
const __dirname = path.resolve();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
connectDb();
// Định nghĩa thư mục upload
const uploadDir = path.join(__dirname, "src/uploads/files");

// Kiểm tra và tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình static file cho client truy cập trực tiếp
app.use("/files", express.static(uploadDir));

// Cấu hình Multer để upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất bằng cách ghép thời gian và số ngẫu nhiên với tên gốc
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// API: Upload file
app.post("/files/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Không có file nào được tải lên" });
  }
  const filePath = "/files/" + req.file.filename;
  res.json({ message: "Upload thành công", file: filePath });
});

// API: Lấy danh sách file, có thể lọc theo loại (images, xlsx, powerpoint, word)
app.get("/files/get-files", (req, res) => {
  const { type } = req.query;
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi đọc thư mục" });
    }
    let filteredFiles = files;
    if (type) {
      // Định nghĩa map giữa type và các định dạng file tương ứng
      const extMap = {
        images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
        xlsx: [".xlsx", ".xls", ".xlsm", ".xlsb", ".xlsm", ".xlsb", ".csv"],
        powerpoint: [".ppt", ".pptx"],
        word: [".doc", ".docx"],
        pdf: [".pdf"],
      };
      const allowedExt = extMap[type.toLowerCase()];
      if (allowedExt) {
        filteredFiles = files.filter((file) =>
          allowedExt.includes(path.extname(file).toLowerCase())
        );
      } else {
        filteredFiles = [];
      }
    }
    res.json({ files: filteredFiles });
  });
});
// API: Xóa file (chú ý: truyền filename dưới dạng param)
app.delete("/files/delete-file/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  if (!filePath.startsWith(uploadDir)) {
    return res.status(400).json({ error: "Yêu cầu không hợp lệ" });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi xóa file" });
    }
    res.json({ message: "Xóa file thành công" });
  });
});

// API: Update file
app.put("/files/update/:filename", upload.single("file"), (req, res) => {
  try {
    const { filename } = req.params;
    const oldFilePath = path.join(uploadDir, filename);

    // Kiểm tra file cũ có tồn tại không
    if (!fs.existsSync(oldFilePath)) {
      return res.status(404).json({ 
        status: 404,
        message: "File không tồn tại",
        data: null
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        status: 400,
        message: "Không có file nào được tải lên",
        data: null
      });
    }

    // Xóa file cũ
    fs.unlinkSync(oldFilePath);

    // Đổi tên file mới thành tên file cũ
    const newFilePath = path.join(uploadDir, req.file.filename);
    fs.renameSync(newFilePath, oldFilePath);

    res.json({
      status: 200,
      message: "Update file thành công",
      data: {
        filePath: `/files/${filename}`,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      status: 500,
      message: "Lỗi khi update file",
      error: error.message
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});
