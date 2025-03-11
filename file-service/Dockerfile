FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p src/uploads/files

EXPOSE 3345

CMD ["node", "src/server.js"]