import express from "express";
import cors from "cors";
import { ConnectSqlServer, sequelizeSql } from "./config/db";
import routerAuth from "./routes/authRoutes";
import routerUser from "./routes/userRoutes";
import routerRole from "./routes/RoleRoutes";
import { setupRabbitMQ } from "./config/rabbitMQ/rabbitMq";

const PORT = process.env.PORT || 9988;

const app = express();
app.use(cors({
   origin: [
    "http://localhost:3002",
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://localhost:4200",
    "http://localhost:4200/",
    "http://localhost:3002/",
    "http://10.73.131.60:5232",
    "http://10.73.131.60:5232/"
  ],
  credentials: true,
}));
app.use(express.json());
app.use('/api', routerAuth);
app.use('/api', routerUser);
app.use('/api', routerRole);
setupRabbitMQ()
ConnectSqlServer()
const string = 'J972524'
const check = string.toLowerCase().includes("j")
const newstring = string.replace(/dmvn|vn/g, '')
console.log(check)
  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
