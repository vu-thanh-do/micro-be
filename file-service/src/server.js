import express from "express";
import multer from "multer";
import path ,{ dirname } from "path";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config()
const __dirname = path.resolve();
const app = express();
const port = process.env.PORT;
app.use(cors())
app.use('/images', express.static(path.join(__dirname, 'src/uploads/images')));
app.use('/files', express.static(path.join(__dirname, 'src/uploads/files')));
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

