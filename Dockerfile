FROM golang:1.25
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends imagemagick python3 \
    && rm -rf /var/lib/apt/lists/*

COPY . .
COPY config.staging.json config.json
RUN go build
EXPOSE 8095

CMD ["./kgpz_web"]
