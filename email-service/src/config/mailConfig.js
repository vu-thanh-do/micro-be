import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  templatesPath: path.join(__dirname, '../template'), // Luôn đúng theo vị trí thật
  mailHost: '172.24.46.52',
  mailPort: 25,
};
