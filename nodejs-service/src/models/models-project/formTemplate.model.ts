import mongoose, { Model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IRequireData } from "../../types/requireData.type";
import { IFormTemplate } from "../../types/formTemplate.type";

const FormTemplateSchema = new mongoose.Schema(
  {
    nameForm: {
      type: Object,
    },
    typeForm: {
      type: String,
    },
    version: {
      type: String,
    },
    dateApply: {
      type: Date,
    },
    fields: [],
    codeApproval: [
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
