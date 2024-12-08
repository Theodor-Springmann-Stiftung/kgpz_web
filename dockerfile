FROM node:lts-alpine
COPY . /source

WORKDIR /source
RUN rm -rf ./data_git/
RUN rm -rf ./cache_gnd/
RUN npm --prefix ./views install
RUN npm --prefix ./views run build -- --config vite.config.js

FROM golang:1.23
COPY --from=0 /source /source
WORKDIR /source
RUN go build -o /app/kgpz . 
COPY ./config.dev.json /app/config.dev.json

WORKDIR /app
CMD ["/app/kgpz"]
