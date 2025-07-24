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

# Install Node.js and curl for health checks
RUN apk add --no-cache nodejs npm curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for uploads and embeddings
RUN mkdir -p /app/uploads /app/embeddings /app/models /app/logs
RUN chown -R nginx:nginx /app

# Create non-root user for security
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Health check with multiple endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:80/health || curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Labels for metadata
LABEL maintainer="AI Chatbot Team"
LABEL version="1.0.0"
LABEL description="Advanced AI Chatbot with ML/NLP Integration"
LABEL org.opencontainers.image.source="https://github.com/your-org/ai-chatbot"

# Switch to non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]