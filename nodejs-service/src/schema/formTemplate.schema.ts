import Joi from "joi";

class FormTemplateSchema {
  createLoggerSchema = Joi.object({
    message: Joi.string().required().messages({
      "string.base": `"Name " phải là kiểu  "text"`,
    }),
    typeForm: Joi.string().required().messages({
      "string.base": `"typeForm " phải là kiểu  "text"`,
    }),
    status: Joi.string().required().messages({
      "string.base": `"status " phải là kiểu  "text"`,
    }),
  });
}
export default FormTemplateSchema;
