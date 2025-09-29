FROM golang:1.25
WORKDIR /app

COPY . .
RUN go build
EXPOSE 8082

CMD ["./lenz-web"]

