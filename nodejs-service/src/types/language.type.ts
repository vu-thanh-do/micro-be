import { Document } from "mongoose";

export interface ILanguage extends Document {
  group: string;
  key: string;
  message: object;
  Title: object;
  data: object;
}
export interface ILanguageDocument extends Document, ILanguage {}
