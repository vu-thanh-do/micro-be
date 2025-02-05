import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { config } from './config.js';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const renderTemplate = (templateName, context) => {
  const templatePath = path.join(config.templatesPath, `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  return template(context);
};

export const sendEmail = async (data) => {
  try {
    const htmlContent = renderTemplate(data.templateName, data.context);
    const mailOptions = {
      from: `"Hệ thống tuyển dụng" <${config.smtp.user}>`,
      to: data.to,
      cc: data.cc || [],
      bcc: data.bcc || [],
      subject: data.subject,
      html: htmlContent,
      text: data.text, 
    };
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: 'Email sent successfully',
      info: info,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error sending email',
      error: error.message,
    };
  }
};
