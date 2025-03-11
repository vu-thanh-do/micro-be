FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx tsc

EXPOSE 9988

CMD ["node", "dist/src/server.js"]