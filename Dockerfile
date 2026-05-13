FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/
RUN npm install
COPY . .
EXPOSE 4003
CMD ["npm","start"]
