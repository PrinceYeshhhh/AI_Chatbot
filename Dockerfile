# Multi-stage build for production-ready AI Chatbot
FROM node:18-alpine AS deps

# Install dependencies only when needed
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production runner stage
FROM nginx:alpine AS runner

# Install Node.js for any server-side requirements
RUN apk add --no-cache nodejs npm

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for uploads and embeddings
RUN mkdir -p /app/uploads /app/embeddings /app/models
RUN chown -R nginx:nginx /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Labels for metadata
LABEL maintainer="AI Chatbot Team"
LABEL version="1.0.0"
LABEL description="Advanced AI Chatbot with ML/NLP Integration"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]