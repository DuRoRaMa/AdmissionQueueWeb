FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 4173
RUN npm run build-only
CMD [ "npm", "run", "preview" ]
