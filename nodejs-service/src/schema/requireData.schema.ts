import Joi from "joi";
class RequireDataSchema {
  createRequireDataSchema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": `"Name " phải là kiểu  "text"`,
    }),
  });
  editRequireDataSchema = Joi.object({});
}
export default RequireDataSchema;
