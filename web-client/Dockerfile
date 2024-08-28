FROM node:18-alpine
WORKDIR /ui
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 3000
CMD node .output/server/index.mjs
