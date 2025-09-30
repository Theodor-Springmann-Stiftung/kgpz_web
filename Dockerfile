FROM golang:1.25
WORKDIR /app

COPY . .
COPY config.staging.json config.json
RUN go build
EXPOSE 8095

CMD ["./kgpz_web"]

