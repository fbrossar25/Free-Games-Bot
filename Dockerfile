FROM node:24-alpine
ARG APP_DIR=/app

# NODE_ENV=production -> --production flag for yarn install
ARG NODE_ENV=production

ENV TZ=Europe/Paris \
    CONF_DIR=$APP_DIR/conf

RUN corepack enable

# cd $APP_DIR
WORKDIR $APP_DIR

# copy entire app ignoring files and dirctories listed in .dockerignore
COPY . .

# using --ignore-scripts flag to prevent node-gyp to build
# so we don't have to add these dependencies : py3-pip git make g++
# they're no needed with the bot
RUN yarn install --immutable --ignore-scripts \
    && yarn cache clean

VOLUME $APP_DIR/conf

CMD ["node", "src/index.ts"]
