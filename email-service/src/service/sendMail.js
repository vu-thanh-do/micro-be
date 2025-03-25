import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import juice from 'juice';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  host: '172.24.46.52',  
  port: 25,
  secure: false, // Nếu không dùng SSL
  tls: {
    rejectUnauthorized: false, // Nếu là mail server nội bộ
  },
});

// Hàm render nội dung HTML từ template
const renderTemplate = (templateName, context = {}) => {
  const templatePath = path.join(__dirname, '../template', `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template ${templateName}.hbs không tồn tại.`);
  }

  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const compiledTemplate = handlebars.compile(templateSource);
  return compiledTemplate(context);
};

// Hàm gửi email
 const sendEmailNotification = async ({
  to,
  subject,
  templateName,
  context = {},
  cc = [],
  bcc = [],
  text = '',
  from = '"Hệ thống tuyển dụng" <recruitment@ap.denso.com>',
}) => {
  try {
    const rawHtml  = renderTemplate(templateName, context);
    const html = juice(rawHtml, {
      removeStyleTags: true,
      applyStyleTags: true,
      preserveImportant: true,
      preserveMediaQueries: true,
      webResources: {
        images: true // Bật chế độ nhúng hình ảnh
      }
    });    const mailOptions = {
      from,
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'X-Mailer': 'DENSO Recruitment System'
      }
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Gửi email thành công!',
      info,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Gửi email thất bại!',
      error: error.message,
    };
  }
};
export default sendEmailNotification;