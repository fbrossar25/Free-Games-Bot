FROM node:16

WORKDIR /opt/free-games-bot

COPY package*.json ./

RUN npm install

COPY . .

VOLUME /opt/free-games-bot/conf

CMD ["node", "index.js"]