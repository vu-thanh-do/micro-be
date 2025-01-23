import express, { Request, Response } from "express";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { rateLimiter } from "./middleware/rateLimiter";
import rootRoutes from "./routes";
import jwt from 'jsonwebtoken'
import cors from 'cors'
const app = express();

app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimiter);
app.use("/api", rootRoutes);
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3002',
];

app.use(cors({
  origin: function (origin, callback) {
    // Kiểm tra nếu origin có trong danh sách allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Cho phép gửi cookie hoặc thông tin xác thực
}));
app.post('/api/login', (req :any, res:any) => {
  // Generate JWT
  const token = jwt.sign(
    {
      id: 1,
      name: 'do kun',
      role: 'admin',
    },
    '123123',
    { expiresIn: '1h' } // Token expires in 1 hour
  );

  res.json({ message: 'Login successful', token });
});
app.get("/", (req: any, res: any) => {
  return res.json("API GATEWAY RUNNING");
});
export default app;
