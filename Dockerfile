FROM golang:1.25
WORKDIR /app

COPY . .
COPY config.staging.json config.json
RUN go build

CMD ["./kgpz_web"]
