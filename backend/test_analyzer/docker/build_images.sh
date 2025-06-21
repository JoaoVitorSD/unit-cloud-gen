#!/bin/bash

# Build Docker images for test analyzers with volume support

set -e

echo "Building Python test analyzer image..."
cd python
docker build -t test-analyzer-python:latest .
cd ..

echo "Building JavaScript test analyzer image..."
cd javascript
docker build -t test-analyzer-javascript:latest .
cd ..

echo "Docker images built successfully!"
echo "Available images:"
echo "  - test-analyzer-python:latest (uses pytest with coverage)"
echo "  - test-analyzer-javascript:latest (uses Jest with coverage)"
echo ""
echo "Images are configured to:"
echo "  - Accept source and test code as command line arguments"
echo "  - Use volume mounts for persistent file storage"
echo "  - Run tests directly with coverage reporting" 