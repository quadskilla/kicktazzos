FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8025
ENV DATA_DIR=/data

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY . .

RUN mkdir -p /data

VOLUME ["/data"]
EXPOSE 8025

CMD ["npm", "start"]
