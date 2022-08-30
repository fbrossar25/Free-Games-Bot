FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

VOLUME /log

CMD [ "node", "index.js", "&>", "/log/free-games-bot.log"]