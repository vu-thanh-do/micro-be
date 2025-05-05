import mongoose, { Model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IFormTemplate } from "../../types/formTemplate.type";

const SpecificCodeApproveSchema = new Schema({
  employeeCode: String,
  employeeName: String, 
  employeeEmail: String,
  deptId: String,
});

const ExcludeCodeApproveSchema = new Schema({
  employeeCode: String,
  employeeName: String, 
  employeeEmail: String,
  deptId: String,
});

const CodeApprovalSchema = new Schema({
  _idCodeApproval: {
    type: Schema.Types.ObjectId,
    ref: "CodeApproval",
    required: true
  },
  status: {
    type: String,
    required: true
  },
  indexSTT: {
    type: Number,
    required: true
  },
  pic :{
    type: {
      employeeCode: String,
      employeeName: String,
      employeeEmail: String,
    },
  },
  specificCodeApprove: [SpecificCodeApproveSchema],
  excludeCodeApprove: [ExcludeCodeApproveSchema],
  listUserApprove: [SpecificCodeApproveSchema]
});

const FormTemplateSchema = new Schema(
  {
    nameForm: {
      type: Object,
      required: true
    },
    typeForm: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    dateApply: {
      type: Date,
      required: true
    },
    fields: [],
    codeApproval: [CodeApprovalSchema],
    status: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

FormTemplateSchema.plugin(mongoosePaginate);

const FormTemplate: Model<IFormTemplate> = mongoose.model<IFormTemplate>(
  "FormTemplate",
  FormTemplateSchema
);

export default FormTemplate;
