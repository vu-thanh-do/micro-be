import Joi from "joi"

class NotificationSchema {
    createNotificationSchema =Joi.object({
        message:Joi.string().required().messages({
            "string.base": `"Name " phải là kiểu  "text"`,
        }),
        userId:Joi.string().required().messages({
            "string.base": `"userId " phải là kiểu  "text"`,
        }),
    })
  
}
export default NotificationSchema