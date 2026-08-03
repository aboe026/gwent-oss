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
RUN yarn install
RUN yarn build-all
RUN yarn cache clean --all

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

COPY --from=build ${APP_DIR} ${APP_DIR}

WORKDIR ${APP_DIR}/msvs/ui
RUN corepack enable && yarn workspaces focus --production

EXPOSE 3000
ENV CLIENT_DIR=../../libs/client/build
ENV IMAGES_DIR=../../images
CMD ["yarn", "node", "build/src/index.js"]
