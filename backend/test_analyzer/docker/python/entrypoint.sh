#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_code> <test_code>"
    exit 1
fi

# Create source and test files
echo "$1" > /app/source.py
echo "$2" > /app/test_source.py

# Run pytest with coverage
python -m pytest --cov=source --cov-report=term-missing --cov-report=json --cov-report=html /app/test_source.py -v 