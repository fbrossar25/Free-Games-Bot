FROM node:18-alpine

# NODE_ENV=production -> --production flag for yarn install
ARG NODE_ENV=production

ENV TZ=Europe/Paris \
    CONFIG_DIR=/opt/free-games-bot/conf

# cd /opt/free-games-bot
WORKDIR /opt/free-games-bot

# copy entire app ignoring files and dirctories listed in .dockerignore
COPY . .

# using --ignore-scripts flag to prevent node-gyp to build
# so we don't have to add these dependencies : py3-pip git make g++
# they're no needed with the bot
RUN yarn global add typescript ts-node \
    && yarn install --ignore-scripts \
    && yarn cache clean

VOLUME /opt/free-games-bot/conf

CMD ["yarn", "run", "start"]