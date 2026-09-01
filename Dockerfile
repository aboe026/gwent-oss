ARG APP_DIR=/opt/gwent-oss
ARG BUILD=0
ARG NODE_VERSION=24.18.1
ARG TARGET=api

#################
# Monorepo Base #
#################
FROM node:${NODE_VERSION}-alpine AS base

ARG APP_DIR
ARG BUILD

ENV NODE_ENV=production

COPY . ${APP_DIR}

WORKDIR ${APP_DIR}
RUN corepack enable
# Ensure Yarn binary available on local filesystem for airgapped containers
RUN yarn set version $(node -p "require('./package.json').packageManager.split('@')[1]") --yarn-path
RUN yarn install
RUN yarn build-libs
RUN echo "{\"buildNumber\": ${BUILD}}" > app-info.json

######################
# Microservice Build #
######################
FROM node:${NODE_VERSION}-alpine AS build

ARG APP_DIR
ARG BUILD
ARG VERSION
ARG TARGET

ENV NODE_ENV=production

LABEL build=${BUILD}
LABEL version=${VERSION}

COPY --from=base ${APP_DIR} ${APP_DIR}

WORKDIR ${APP_DIR}/msvs/${TARGET}

# Build microservice
RUN corepack enable
RUN yarn build

# Install microservice-specific dependencies only
RUN yarn workspaces focus --production

# Ensure Yarn binary available on local filesystem for airgapped containers
RUN cp -r ../../.yarn .yarn
RUN cp ${APP_DIR}/.yarnrc.yml .yarnrc.yml

# ensure app-info.json available
RUN cp ../../app-info.json .

# ensure entrypoint available
RUN cp ../../entrypoint.sh .
RUN chmod +x entrypoint.sh
RUN dos2unix entrypoint.sh

###############
# API Runtime #
###############
FROM node:${NODE_VERSION}-alpine AS api

ARG APP_DIR
ARG BUILD
ARG VERSION
ARG TARGET

ENV NODE_ENV=production

LABEL build=${BUILD}
LABEL version=${VERSION}

RUN adduser --disabled-password --gecos "" gwent-oss

COPY --chown=gwent-oss:gwent-oss --from=build ${APP_DIR} ${APP_DIR}

WORKDIR ${APP_DIR}/msvs/${TARGET}

USER gwent-oss

ENV COREPACK_ENABLE_NETWORK=0

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
# expands to "node .yarn/releases/yarn-<node_version>.cjs node build/src/index.js" due to entrypoint to use projects pre-downloaded yarn executable
CMD ["node", "build/src/index.js"]

##############
# UI Runtime #
##############
FROM node:${NODE_VERSION}-alpine AS ui

ARG APP_DIR
ARG BUILD
ARG VERSION
ARG TARGET

ENV NODE_ENV=production

LABEL build=${BUILD}
LABEL version=${VERSION}

RUN adduser --disabled-password --gecos "" gwent-oss

COPY --chown=gwent-oss:gwent-oss --from=build ${APP_DIR} ${APP_DIR}

WORKDIR ${APP_DIR}/msvs/${TARGET}

USER gwent-oss

ENV COREPACK_ENABLE_NETWORK=0
ENV CLIENT_DIR=../../libs/client/build
ENV IMAGES_DIR=../../images

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
# expands to "node .yarn/releases/yarn-<node_version>.cjs node build/src/index.js" due to entrypoint to use projects pre-downloaded yarn executable
CMD ["node", "build/src/index.js"]