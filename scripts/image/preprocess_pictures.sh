#!/bin/bash

set -euo pipefail

PICTURES_DIR="${1:-/app/data/pictures}"

if [ ! -d "$PICTURES_DIR" ]; then
    echo "Error: Pictures directory '$PICTURES_DIR' not found."
    exit 1
fi

echo "Preprocessing pictures in $PICTURES_DIR"
python3 ./scripts/image/normalizefns.py "$PICTURES_DIR"
./scripts/image/generate_webp_previews.sh "$PICTURES_DIR"
./scripts/image/generate_webp_originals.sh "$PICTURES_DIR"
