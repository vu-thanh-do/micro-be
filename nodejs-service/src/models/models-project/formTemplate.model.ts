import mongoose, { Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IRequireData } from "../../types/requireData.type";
import { IFormTemplate } from "../../types/formTemplate.type";

const FormTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    typeForm: {
      type: String,
    },
    dataForm: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RequireData",
      },
    ],
    approval: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CodeApproval",
      },
    ],
    status: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
FormTemplateSchema.plugin(mongoosePaginate);
const FormTemplate: Model<IFormTemplate> = mongoose.model<IFormTemplate>(
  "FormTemplate",
  FormTemplateSchema
);
export default FormTemplate;
