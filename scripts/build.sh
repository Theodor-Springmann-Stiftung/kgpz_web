#!/bin/bash

rm -rf ./bin
npm --prefix ./views install
npm --prefix ./views run build -- --config vite.config.js
mkdir -p ./bin
go build -o ./bin/kgpz . 
if [ -f ./config.json ]; then
cp ./config.json bin/config.json
else
cp ./config.dev.json ./bin/config.json
fi

