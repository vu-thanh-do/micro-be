// index.js
import { sendEmail } from './sendMail.js';

const emailData = {
  to: 'recipient@example.com',
  subject: 'Welcome to Our Platform!',
  text: 'This is a plain text email.',
  templateName: 'welcome', // Tên template (không cần phần mở rộng .hbs)
  context: {
    name: 'John Doe', // Dữ liệu cho template
  },
};

sendEmail(emailData).then(response => {
  if (response.success) {
    console.log(response.message);
  } else {
    console.log('Email sending failed:', response.error);
  }
});
