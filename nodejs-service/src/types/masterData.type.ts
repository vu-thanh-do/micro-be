import { Document } from "mongoose";

export interface IMasterData extends Document {
  group: string;
  code: string;
  name: object;
  description: object;
  data: object;
}
