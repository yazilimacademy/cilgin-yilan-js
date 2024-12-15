# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Install curl for healthcheck
RUN apk --no-cache add curl

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for better caching
COPY server/package*.json server/
COPY server/yarn.lock server/

# Install dependencies
WORKDIR /app/server
RUN yarn install --production

# Copy the rest of the application
WORKDIR /app
COPY server server/
COPY public public/

# Set the working directory back to server
WORKDIR /app/server

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/ || exit 1

# Expose the port the app runs on
EXPOSE 3001

# Start the server
CMD ["node", "src/index.js"]