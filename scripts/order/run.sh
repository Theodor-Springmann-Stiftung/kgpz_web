#!/bin/bash
# Script to run the order hints processor with the virtual environment

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
    source venv/bin/activate
    pip install lxml
else
    source venv/bin/activate
fi

# Run the script with passed arguments
python add_order_hints.py "$@"