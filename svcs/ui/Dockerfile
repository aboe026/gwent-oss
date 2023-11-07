ARG APP_DIR=/opt/gwent
ARG BUILD=0

#########
# BUILD #
#########
FROM node:20-alpine AS build

ARG APP_DIR
ARG BUILD

ENV NODE_ENV=production

COPY . ${APP_DIR}

WORKDIR ${APP_DIR}/svcs/ui
RUN yarn install --immutable
RUN yarn build
RUN yarn cache clean --all

###########
# RUNTIME #
###########
FROM node:20-alpine

ARG APP_DIR
ARG BUILD
ARG VERSION

ENV NODE_ENV=production

LABEL build=${BUILD}
LABEL version=${VERSION}

COPY --from=build ${APP_DIR} ${APP_DIR}

WORKDIR ${APP_DIR}/svcs/ui
RUN yarn workspaces focus --production

EXPOSE 3000
ENV CLIENT_DIR=../../libs/client/build
CMD yarn node build/src/index.js