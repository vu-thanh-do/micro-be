import "express";

declare module "express" {
  interface Request {
    rateLimit?: {
      resetTime?: Date;
    };
  }
}
