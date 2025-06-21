FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Create package.json for Jest setup
COPY package.json /app/package.json

# Install Jest and dependencies
RUN npm install --silent

# Create Jest setup file
COPY jest.setup.js /app/jest.setup.js

# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"] 