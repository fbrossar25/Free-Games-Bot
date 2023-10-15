FROM node:18-alpine

ENV NODE_ENV=dev \
    PYTHONUNBUFFERED=1 \
    BUILD_APKS="python3 build-base git" \
    TZ=Europe/Paris \
    CONFIG_DIR=/opt/free-games-bot/conf

VOLUME /opt/free-games-bot

# nodemon inspect port
EXPOSE 9229

WORKDIR /opt/free-games-bot

# Python layer
RUN apk add --update --no-cache $BUILD_APKS \
    && ln -sf python3 /usr/bin/python \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools

# Node layer
RUN yarn global add typescript ts-node nodemon @types/node@^18.18.5
RUN yarn install

CMD ["node", "--require", "ts-node/register", "--inspect=0.0.0.0:9229", "src/index.ts"]