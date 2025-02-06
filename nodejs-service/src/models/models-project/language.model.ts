import mongoose, { Model, PaginateModel } from "mongoose";
import { INoti } from "../../types/noti.type";
import mongoosePaginate from "mongoose-paginate-v2";
import { IMasterData } from "../../types/masterData.type";
import { ILanguage } from "../../types/language.type";

const LanguageSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    message: { type: Object },
    Title: { type: Object },
    data: { type: Object },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

LanguageSchema.plugin(mongoosePaginate);
const Language: Model<ILanguage> = mongoose.model<ILanguage>(
  "Language",
  LanguageSchema
);
export default Language;
