FROM node:18-alpine

ENV NODE_ENV=production PYTHONUNBUFFERED=1 BUILD_APKS="python3 build-base git"

WORKDIR /opt/free-games-bot

# Python layer
RUN apk add --update --no-cache $BUILD_APKS \
    && ln -sf python3 /usr/bin/python \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools

# Npm layers
COPY package.json ./

RUN npm install -g gulp-cli typescript \
    && npm install --production \
    # cleanup python
    && apk del $BUILD_APKS \
    # cleanup npm globals
    && npm uninstall -g gulp-cli typescript
# && rm -rf ./node_modules
# TODO bundle app into single file to be able to cleanup node_modules

COPY . .

RUN gulp build

VOLUME /opt/free-games-bot/conf

CMD ["node", "out/index.ts"]