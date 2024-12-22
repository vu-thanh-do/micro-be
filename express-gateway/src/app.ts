import express from "express";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { rateLimiter } from "./middleware/rateLimiter";
import rootRoutes from "./routes";

const app = express();

app.use(express.json());
app.use(loggingMiddleware);
app.use(rateLimiter);
app.use("/api", rootRoutes);

export default app;
