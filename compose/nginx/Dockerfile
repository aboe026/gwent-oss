FROM nginx:1.31.3

RUN apt-get update && \
    apt-get install -y openssl && \
    openssl req \
        -x509 \
        -sha256 \
        -nodes \
        -days 365 \
        -newkey rsa:2048 \
        -subj "/C=US/ST=Washington/L=Seattle/CN=gwent.com" \
        -keyout /etc/ssl/private/server.key \
        -out /etc/ssl/certs/server.crt