FROM golang:1.25
WORKDIR /app

COPY . .
RUN go build
EXPOSE 8095

CMD ["./kgpz_web"]

