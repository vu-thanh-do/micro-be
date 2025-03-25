import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import juice from 'juice';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renderTemplate = (templateName, context = {}) => {
  const templatePath = path.join(__dirname, 'template', `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Không tìm thấy template: ${templatePath}`);
  }

  const source = fs.readFileSync(templatePath, 'utf8');
  const compiled = handlebars.compile(source);
  const rawHtml = compiled(context);
  return juice(rawHtml); // inline CSS cho giống gửi mail
};

const context = {   
  creatorName: 'Nguyễn Văn A',
  requestId: 'REQ-20250324-001',
  positionName: 'Senior Developer',
  createdAt: '24/03/2025 - 16:30',
  trackingLink: 'https://hr.denso.com/request/REQ-20250324-001',
};

const html = renderTemplate('createRequestRecruit', context);

// Ghi ra file HTML để mở trình duyệt
const outputPath = path.join(__dirname, 'preview.html');
fs.writeFileSync(outputPath, html);

console.log('✅ Đã render HTML ra:', outputPath);
