import express from "express";
import cors from "cors";
import { ConnectSqlServer, sequelizeSql } from "./config/db";
import routerAuth from "./routes/authRoutes";
import routerUser from "./routes/userRoutes";

const PORT = process.env.PORT || 9988;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routerAuth);
app.use('/api', routerUser);

ConnectSqlServer()
const string = 'J972524'
const check = string.toLowerCase().includes("j")
const newstring = string.replace(/dmvn|vn/g, '')
console.log(check)
  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
