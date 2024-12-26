import { Document } from "mongoose";

export interface INoti extends Document {
  message: string;
  userId: string;
  date: Date;
}
