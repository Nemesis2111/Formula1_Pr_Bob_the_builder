FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN chown -R 1001:0 /app

USER 1001

EXPOSE 3001

CMD ["node", "src/server.js"]