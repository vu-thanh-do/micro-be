import * as dotenv from 'dotenv';
dotenv.config();
export const config = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  templatesPath: process.env.TEMPLATES_PATH || './templates',
};
