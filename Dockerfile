# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (use npm ci if lock file exists, otherwise npm install)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only (use npm ci if lock file exists, otherwise npm install)
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables (can be overridden)
ENV NODE_ENV=production

# Run the MCP server
ENTRYPOINT ["node", "dist/index.js"]

