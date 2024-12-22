import { Document } from "mongoose";

export interface INoti extends Document {
  _id: string;
  message: string;
  userId: string;
  date: Date;
}
