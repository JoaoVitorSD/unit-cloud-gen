#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <source_code> <test_code>"
    exit 1
fi

# Create source and test files
echo "$1" > /app/source.js
echo "$2" > /app/test.js

# Run Jest with coverage and JSON output
npx jest --coverage --coverageReporters=json --json --outputFile=/app/test-results.json

# Store the exit code
EXIT_CODE=$?

# Output JSON results marker and content
echo "===JSON_RESULTS_START==="
cat /app/test-results.json
echo "===JSON_RESULTS_END==="

# Output coverage JSON if it exists
if [ -f "/app/coverage/coverage-final.json" ]; then
    echo "===COVERAGE_JSON_START==="
    cat /app/coverage/coverage-final.json
    echo "===COVERAGE_JSON_END==="
fi

# Exit with Jest's exit code
exit $EXIT_CODE