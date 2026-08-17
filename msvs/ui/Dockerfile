ARG APP_DIR=/opt/gwent-oss
ARG BUILD=0

#########
# BUILD #
#########
FROM node:24.18.1-alpine AS build

ARG APP_DIR
ARG BUILD

ENV NODE_ENV=production

COPY . ${APP_DIR}

WORKDIR ${APP_DIR}/msvs/ui
RUN corepack enable
# Ensure Yarn binary available on local filesystem for airgapped containers
RUN yarn set version $(node -p "require('../../package.json').packageManager.split('@')[1]") --yarn-path
RUN yarn install
RUN yarn build-all
RUN echo "{\"buildNumber\": ${BUILD}}" > app-info.json

###########
# RUNTIME #
###########
FROM node:24.18.1-alpine

ARG APP_DIR
ARG BUILD
ARG VERSION

ENV NODE_ENV=production

LABEL build=${BUILD}
LABEL version=${VERSION}

RUN adduser --disabled-password --gecos "" gwent-oss

COPY --chown=gwent-oss:gwent-oss --from=build ${APP_DIR} ${APP_DIR}

WORKDIR ${APP_DIR}/msvs/ui
RUN corepack enable && \
    yarn workspaces focus --production && \
    # Ensure Yarn binary available on local filesystem for airgapped containers
    cp -r ../../.yarn .yarn && \
    cp ${APP_DIR}/.yarnrc.yml .yarnrc.yml && \
    cp ../../entrypoint.sh /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

USER gwent-oss

ENV COREPACK_ENABLE_NETWORK=0
ENV CLIENT_DIR=../../libs/client/build
ENV IMAGES_DIR=../../images

EXPOSE 3000

ENTRYPOINT ["entrypoint.sh"]
# expands to "node .yarn/releases/yarn-<node_version>.cjs node build/src/index.js" due to entrypoint to use projects pre-downloaded yarn executable
CMD ["node", "build/src/index.js"]
