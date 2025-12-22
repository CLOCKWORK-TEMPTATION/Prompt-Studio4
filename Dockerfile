# Multi-stage Docker build for Prompt Studio
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install Python for SDK generation and runtime testing
RUN apk add --no-cache python3 py3-pip curl jq

# Install common Python packages that might be needed for SDK testing
RUN pip3 install --no-cache-dir requests tenacity dataclasses-json

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application from build stage
COPY --from=base --chown=nextjs:nodejs /app ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start"]