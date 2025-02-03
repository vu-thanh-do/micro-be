import express, { Request, Response } from "express";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { rateLimiter } from "./middleware/rateLimiter";
import rootRoutes from "./routes";
import jwt from "jsonwebtoken";
import cors from "cors";
import httpProxy from "http-proxy";
import { config } from "./config";
const app = express();
app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimiter);
app.use("/api", rootRoutes);
const proxy = httpProxy.createProxyServer();
// sau này thêm middleware check token

app.use("/image", (req: Request, res: Response, next) => {

  req.url = req.url.replace(/^\/image/, "/images");
  console.log(`Rewriting request to: ${req.url}`);
  next();
});
app.use("/image", (req: Request, res: Response) => {
  const targetUrl = `http://localhost:3345/images${req.url}`;
  console.log(`Proxying request to: ${targetUrl}`);
  proxy.web(
    req,
    res,
    {
      target: "http://localhost:3345/images",
      changeOrigin: true,
      proxyTimeout: 5000,
    },
    (err) => {
      console.error("Proxy error:", err.message);
      res.status(500).json({ error: "Proxy error", message: err.message });
    }
  );
});
const allowedOrigins = ["http://localhost:4200", "http://localhost:3002"];
app.use(
  cors({
    origin: function (origin, callback) {
      // Kiểm tra nếu origin có trong danh sách allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Cho phép gửi cookie hoặc thông tin xác thực
  })
);

app.get("/", (req: any, res: any) => {
  return res.json("API GATEWAY RUNNING");
});
export default app;
