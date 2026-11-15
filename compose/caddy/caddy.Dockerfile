ARG CADDY_VERSION=2.11.9

FROM caddy:${CADDY_VERSION}-builder-alpine AS builder
RUN xcaddy build \
    --with github.com/mholt/caddy-ratelimit

FROM caddy:${CADDY_VERSION}
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
