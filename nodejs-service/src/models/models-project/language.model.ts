import mongoose, { Model, PaginateModel } from "mongoose";
import { INoti } from "../../types/noti.type";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

import { IMasterData } from "../../types/masterData.type";
import { ILanguage, ILanguageDocument } from "../../types/language.type";
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
LanguageSchema.plugin(mongooseAggregatePaginate);

interface LanguageModel extends 
  mongoose.PaginateModel<ILanguageDocument>,
  mongoose.AggregatePaginateModel<ILanguageDocument> {}
  const Language = mongoose.model<ILanguage, LanguageModel>(
  "Language",
  LanguageSchema
);
export default Language;
