FROM node:lts-alpine
COPY . /source

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    build-base


ADD https://go.dev/dl/go1.23.2.linux-amd64.tar.gz /tmp/go.tar.gz
RUN tar -C /usr/local -xzf /tmp/go.tar.gz
RUN export PATH=$PATH:/usr/local/go/bin

WORKDIR /source
RUN rm -rf ./data_git/
RUN rm -rf ./cache_gnd/
RUN npm --prefix ./views install
RUN npm --prefix ./views run build -- --config vite.config.js
RUN /usr/local/go/bin/go build -o /app/kgpz . 
COPY ./config.dev.json /app/config.dev.json

WORKDIR /app
CMD ["/app/kgpz"]
