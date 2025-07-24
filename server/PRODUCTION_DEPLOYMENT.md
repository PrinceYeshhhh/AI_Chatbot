# AI Chatbot Backend - Production Deployment Guide

## Overview

This guide covers the complete production deployment of the AI Chatbot backend, including security, monitoring, scaling, and maintenance.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Nginx Proxy   │    │   Application   │
│   (Cloud/On-Prem)│   │   (SSL/TLS)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │  ChromaDB Vector│
                       │   (Session/Data)│    │   Store         │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Supabase DB    │    │   Monitoring    │
                       │  (PostgreSQL)   │    │  (Prometheus)   │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file with production values:

```bash
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database
NEON_DATABASE_URL=your_neon_database_url
NEON_HOST=your_neon_host.neon.tech
NEON_DATABASE=your_database_name
NEON_USERNAME=your_username
NEON_PASSWORD=your_password

# AI Services
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama3-70b-8192
GROQ_MAX_TOKENS=1000
GROQ_TEMPERATURE=0.7
TOGETHER_API_KEY=your_together_api_key
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base

# Security
JWT_SECRET=your_very_long_random_jwt_secret
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Vector Store
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=smart_brain_embeddings

# Cache
REDIS_URL=redis://redis:6379

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
```

### 2. Docker Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 3. Health Checks

```bash
# Basic health check
curl http://localhost:3001/api/status/health

# Detailed system status
curl http://localhost:3001/api/status/detailed

# Prometheus metrics
curl http://localhost:3001/api/status/metrics
```

## 🔒 Security Configuration

### 1. SSL/TLS Setup

Create SSL certificates and update nginx configuration:

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/nginx.key -out ssl/nginx.crt

# Update nginx.conf with SSL configuration
```

### 2. Security Headers

The application includes comprehensive security middleware:

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: DDoS protection
- **Input Sanitization**: XSS prevention
- **JWT Authentication**: Secure API access

### 3. Environment Security

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Set secure file permissions
chmod 600 .env
chmod 600 ssl/*.key
```

## 📊 Monitoring & Observability

### 1. Prometheus Metrics

Available metrics endpoints:

- `/api/status/metrics` - Prometheus format
- `/api/status/health` - Health status
- `/api/status/detailed` - Comprehensive system info

### 2. Grafana Dashboards

Access Grafana at `http://localhost:3000`:

- **System Overview**: CPU, Memory, Disk usage
- **Application Metrics**: Request rate, response times, errors
- **AI Service Metrics**: Groq API usage, vector search performance
- **Database Metrics**: Connection pools, query performance

### 3. Alerting

Configure alerts for:

- High error rates (>10% for 5 minutes)
- High response times (>2s 95th percentile)
- Service downtime
- High memory usage (>90%)
- High CPU usage (>80%)

## 🔧 Configuration Management

### 1. Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | Yes |
| `PORT` | Server port | `3001` | Yes |
| `NEON_DATABASE_URL` | Database URL | - | Yes |
| `GROQ_API_KEY` | Groq API key | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` | Yes |

### 2. AI Model Configuration

```bash
# Groq Configuration
GROQ_MODEL=llama3-70b-8192          # Model to use
GROQ_MAX_TOKENS=1000                # Max tokens per response
GROQ_TEMPERATURE=0.7                # Response creativity (0-1)

# Together.ai Configuration
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-base

# Vector Store Configuration
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
SIMILARITY_THRESHOLD=0.7
MAX_VECTOR_RESULTS=5
```

### 3. File Upload Configuration

```bash
# Upload Settings
MAX_FILE_SIZE=10MB
ALLOWED_FILE_TYPES=pdf,docx,txt,md,csv
UPLOAD_DIR=/app/uploads
MAX_FILES_PER_REQUEST=5
```

## 🚀 Scaling Strategies

### 1. Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  app:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis-cluster:6379
```

### 2. Load Balancing

```nginx
# nginx.conf
upstream app_servers {
    server app1:3001;
    server app2:3001;
    server app3:3001;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Database Scaling

- **Read Replicas**: Configure Supabase read replicas
- **Connection Pooling**: Use PgBouncer for connection management
- **Caching**: Implement Redis caching for frequent queries

## 🔄 Backup & Recovery

### 1. Automated Backups

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backup"

# Database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/db-$DATE.sql

# File uploads backup
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /app/uploads

# Vector store backup
tar -czf $BACKUP_DIR/vectors-$DATE.tar.gz /chroma/chroma

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 2. Recovery Procedures

```bash
# Database recovery
psql $DATABASE_URL < backup/db-20240101-120000.sql

# File recovery
tar -xzf backup/uploads-20240101-120000.tar.gz -C /

# Vector store recovery
tar -xzf backup/vectors-20240101-120000.tar.gz -C /
```

## 🛠️ Maintenance

### 1. Log Management

```bash
# Log rotation
logrotate /etc/logrotate.d/ai-chatbot

# Log cleanup
find /var/log/ai-chatbot -name "*.log" -mtime +30 -delete
```

### 2. Performance Optimization

- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Query Optimization**: Monitor slow queries and optimize
- **Caching Strategy**: Implement Redis caching for expensive operations
- **CDN**: Use CDN for static file delivery

### 3. Security Updates

```bash
# Regular security updates
npm audit fix
docker-compose pull
docker-compose up -d

# SSL certificate renewal
certbot renew
```

## 🚨 Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # Increase memory limits
   docker-compose.yml:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   curl http://localhost:3001/api/status/health
   
   # Verify environment variables
   docker-compose exec app env | grep SUPABASE
   ```

3. **Gemini API Errors**
   ```bash
   # Check API key
   curl -H "Authorization: Bearer $GROQ_API_KEY" \
        https://generativelanguage.googleapis.com/v1beta/models
   
   # Monitor usage
   curl http://localhost:3001/api/status/detailed
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
docker-compose up -d

# View detailed logs
docker-compose logs -f app | grep DEBUG
```

## 📈 Performance Tuning

### 1. Application Level

- **Worker Threads**: Use Node.js worker threads for CPU-intensive tasks
- **Streaming**: Implement streaming for large file uploads
- **Compression**: Enable gzip compression for API responses

### 2. Infrastructure Level

- **CPU Limits**: Set appropriate CPU limits for containers
- **Memory Limits**: Configure memory limits based on usage patterns
- **Network Optimization**: Use host networking for high-throughput scenarios

### 3. Database Level

- **Connection Pooling**: Configure connection pool size
- **Query Optimization**: Monitor and optimize slow queries
- **Indexing**: Add indexes for frequently accessed columns

## 🔐 Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] JWT secret is cryptographically secure
- [ ] CORS origins are properly restricted
- [ ] Rate limiting is enabled
- [ ] Input sanitization is active
- [ ] Security headers are set
- [ ] Database credentials are secure
- [ ] API keys are properly stored
- [ ] Logs don't contain sensitive data
- [ ] Regular security updates scheduled

## 📞 Support

For production support:

1. **Monitoring**: Check Grafana dashboards for system health
2. **Logs**: Review application logs for errors
3. **Metrics**: Analyze Prometheus metrics for performance issues
4. **Documentation**: Refer to API documentation at `/api/docs`

## 🎯 Best Practices

1. **Deployment**: Use blue-green deployments for zero downtime
2. **Monitoring**: Set up comprehensive alerting
3. **Backup**: Implement automated backup procedures
4. **Security**: Regular security audits and updates
5. **Performance**: Continuous performance monitoring and optimization
6. **Documentation**: Keep deployment documentation updated 