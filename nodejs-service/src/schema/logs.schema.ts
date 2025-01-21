import Joi from "joi";

class LogSchema {
  createLoggerSchema = Joi.object({
    code: Joi.string().required().messages({
      "string.base": `"code " phải là kiểu  "text"`,
    }),
    logType: Joi.string().required().messages({
      "string.base": `"logType " phải là kiểu  "text"`,
    }),
    content: Joi.string().required().messages({
      "string.base": `"content " phải là kiểu  "text"`,
    }),
    ipAddress: Joi.string().required().messages({
      "string.base": `"ipAddress " phải là kiểu  "text"`,
    }),
  });
}
export default LogSchema;
