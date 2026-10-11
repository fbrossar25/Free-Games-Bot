FROM node:24-alpine
ARG APP_DIR=/app

ENV NODE_ENV=dev \
    PYTHONUNBUFFERED=1 \
    BUILD_APKS="python3 build-base git" \
    TZ=Europe/Paris \
    CONFIG_DIR=$APP_DIR/conf

RUN corepack enable

WORKDIR $APP_DIR

# Node layer
RUN yarn global add typescript ts-node nodemon @types/node@^26 \
    && yarn install --immutable --ignore-scripts

VOLUME $APP_DIR/conf

USER node

# nodemon inspect port
EXPOSE 9229

CMD ["node", "--require", "ts-node/register", "--inspect=0.0.0.0:9229", "src/index.ts"]
