# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy server source files first
COPY server/ ./

# Create public directory and copy public files
RUN mkdir -p /usr/src/app/public
COPY public/* /usr/src/app/public/

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the application
CMD ["npm", "start"]