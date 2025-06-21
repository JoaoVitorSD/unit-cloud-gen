#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_code> <test_code>"
    exit 1
fi

# Create source and test files
echo "$1" > /app/source.js
echo "$2" > /app/test.js

# Run Jest with coverage using the configuration from package.json
npx jest --coverage