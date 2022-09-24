FROM node:16

ENV NODE_ENV=production

WORKDIR /opt/free-games-bot

COPY package.json package-lock.json ./

RUN npm install --production

COPY . .

VOLUME /opt/free-games-bot/conf

CMD ["node", "index.js"]