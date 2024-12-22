import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 100, // Tối đa 10 yêu cầu mỗi phút
  standardHeaders: false, // Không tự động thêm `Retry-After`
  legacyHeaders: false, // Không sử dụng các header cũ `X-RateLimit-*`
  handler: (req: any, res) => {
    // Tính toán thời gian chờ dựa trên thời gian reset
    const retryAfter = Math.ceil(
      (req.rateLimit.resetTime!.getTime() - Date.now()) / 1000
    );

    // Thêm header `Retry-After` vào response
    res.setHeader("Retry-After", retryAfter.toString());

    // Trả về thông báo lỗi kèm thời gian chờ
    res.status(429).json({
      status: 429,
      message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter} giây.`,
    });
  },
});
