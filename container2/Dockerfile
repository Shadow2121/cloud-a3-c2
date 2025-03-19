FROM node:alpine

WORKDIR /app

COPY container2.js .
COPY package.json .

RUN npm install

CMD node container2.js