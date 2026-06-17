FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ARG VITE_BASE_URL
ARG VITE_WS_URL
ARG VITE_PUBLIC_BASE_PATH=/queue/

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_PUBLIC_BASE_PATH=$VITE_PUBLIC_BASE_PATH

COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80