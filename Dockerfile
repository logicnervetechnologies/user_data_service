FROM node:14.17.5-alpine3.14

WORKDIR /app/node

COPY ./node/package.json .
COPY ./node/package-lock.json .
RUN npm install

CMD npm run devstart
