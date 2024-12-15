# Build stage for client
FROM node:20-alpine AS client-builder

# Set working directory for client
WORKDIR /usr/src/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm install

# Copy client source files
COPY client/ ./

# Build client
RUN npm run build

# Build stage for server
FROM node:20-alpine AS server-builder

# Set working directory for server
WORKDIR /usr/src/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm install

# Copy server source files
COPY server/ ./

# Build server TypeScript code
RUN npm run build

# Final stage
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy server package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built server files
COPY --from=server-builder /usr/src/server/dist ./dist

# Create public directory and copy built client files
RUN mkdir -p /usr/src/app/public
COPY --from=client-builder /usr/src/client/dist /usr/src/app/public

# Expose the port the app runs on
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the application
CMD ["npm", "start"]