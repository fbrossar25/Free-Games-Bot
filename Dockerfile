FROM node:18-alpine
ARG APP_DIR=/opt/free-games-bot

# NODE_ENV=production -> --production flag for yarn install
ARG NODE_ENV=production

ENV TZ=Europe/Paris \
    CONFIG_DIR=$APP_DIR/conf

# cd $APP_DIR
WORKDIR $APP_DIR

# copy entire app ignoring files and dirctories listed in .dockerignore
COPY . .

# using --ignore-scripts flag to prevent node-gyp to build
# so we don't have to add these dependencies : py3-pip git make g++
# they're no needed with the bot
RUN yarn global add typescript ts-node @types/node@^18.18.5 \
    && yarn install --ignore-scripts \
    && yarn cache clean

VOLUME $APP_DIR/conf

CMD ["ts-node", "--transpile-only", "src/index.ts"]