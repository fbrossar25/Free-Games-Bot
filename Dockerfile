FROM node:18-alpine

ENV NODE_ENV=production PYTHONUNBUFFERED=1

WORKDIR /opt/free-games-bot

COPY package.json package-lock.json ./

RUN apk add --update --no-cache python3 build-base \
    && ln -sf python3 /usr/bin/python \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools \
    && npm install --production \
    && apk del python3 build-base

COPY . .

VOLUME /opt/free-games-bot/conf

CMD ["node", "index.js"]