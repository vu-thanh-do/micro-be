import  Joi  from 'joi';
export const signInSchema = Joi.object({
    employeeCode: Joi.string().required().messages({
      'string.base': `"employeeCode" phải là kiểu "text"`,
      'string.empty': `"employeeCode" không được bỏ trống`,
      'any.required': `"employeeCode" là trường bắt buộc`,
    }),
    password: Joi.string().required().min(6).messages({
      'string.base': `"password" phải là kiểu "text"`,
      'string.empty': `"password" không được bỏ trống`,
      'string.min': `"password" phải chứa ít nhất {#limit} ký tự`,
      'any.required': `"password" là trường bắt buộc`,
    }),
  });