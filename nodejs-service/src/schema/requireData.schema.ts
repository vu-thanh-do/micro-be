import Joi from "joi";
class RequireDataSchema {
  createRequireDataSchema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": `"Name " phải là kiểu  "text"`,
    }),
    value: Joi.string().required().messages({
      "string.base": `"value " phải là kiểu  "text"`,
    }),
    type: Joi.string().required().messages({
      "string.base": `"type " phải là kiểu  "text"`,
    }),
  });
  editRequireDataSchema = Joi.object({
    _id: Joi.string().required().messages({
      "string.base": `"_id " phải là kiểu  "text"`,
    }),
    name: Joi.string().required().messages({
      "string.base": `"Name " phải là kiểu  "text"`,
    }),
    value: Joi.string().required().messages({
      "string.base": `"value " phải là kiểu  "text"`,
    }),
    type: Joi.string().required().messages({
      "string.base": `"type " phải là kiểu  "text"`,
    }),
  });
}
export default RequireDataSchema;
