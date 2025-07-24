# 🚀 Smart Brain AI Chatbot - Production Deployment Guide

## 📋 Overview

This guide covers deploying the Smart Brain AI Chatbot to production environments. The system uses **Groq** for chat completions, **Together AI** for embeddings, **Cloudinary** for file storage, and **Neon** for the database.

---

## 🏗️ Architecture Overview

### Production Stack
- **Frontend**: Vercel, Netlify, or Railway
- **Backend**: Railway, Render, or DigitalOcean
- **Database**: Neon PostgreSQL
- **Vector Database**: Qdrant Cloud
- **File Storage**: Cloudinary
- **Authentication**: Clerk.dev
- **CDN**: Cloudflare (optional)

---

## 🐳 Docker Deployment

### 1. Backend Dockerfile

```dockerfile
# project/server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]
```

### 2. Frontend Dockerfile

```dockerfile
# project/client/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose for Production

```yaml
# project/docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GROQ_API_KEY=${GROQ_API_KEY}
      - TOGETHER_API_KEY=${TOGETHER_API_KEY}
      - NEON_DATABASE_URL=${NEON_DATABASE_URL}
      - QDRANT_URL=${QDRANT_URL}
      - QDRANT_API_KEY=${QDRANT_API_KEY}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=${FRONTEND_URL}
    volumes:
      - ./server/uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./client
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=${BACKEND_URL}
      - VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
      - VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

---

## ☁️ Cloud Platform Deployment

### 1. Railway Deployment

#### Backend Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
cd server
railway init

# Deploy
railway up
```

#### Environment Variables (Railway Dashboard)
```env
NODE_ENV=production
PORT=3001
GROQ_API_KEY=gsk-your-groq-api-key
TOGETHER_API_KEY=your_together_api_key
NEON_DATABASE_URL=postgresql://username:password@host:port/database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://your-frontend.vercel.app
```

#### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
cd client
vercel --prod
```

### 2. Render Deployment

#### Backend Service
```yaml
# render.yaml
services:
  - type: web
    name: smart-brain-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: GROQ_API_KEY
        sync: false
      - key: TOGETHER_API_KEY
        sync: false
      - key: NEON_DATABASE_URL
        sync: false
      - key: QDRANT_URL
        sync: false
      - key: QDRANT_API_KEY
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
```

### 3. DigitalOcean App Platform

#### Backend Configuration
```yaml
# .do/app.yaml
name: smart-brain-backend
services:
  - name: backend
    source_dir: /server
    github:
      repo: your-username/your-repo
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: GROQ_API_KEY
        scope: RUN_AND_BUILD_TIME
        value: ${GROQ_API_KEY}
      - key: TOGETHER_API_KEY
        scope: RUN_AND_BUILD_TIME
        value: ${TOGETHER_API_KEY}
```

---

## 🔒 SSL Configuration

### 1. Nginx SSL Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
            
            # Security headers
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-XSS-Protection "1; mode=block" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header Referrer-Policy "no-referrer-when-downgrade" always;
            add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
}
```

### 2. Cloudflare SSL

```bash
# Enable Cloudflare SSL
# 1. Add your domain to Cloudflare
# 2. Update nameservers
# 3. Enable SSL/TLS encryption mode: Full (strict)
# 4. Enable HSTS
# 5. Configure security headers
```

---

## 📊 Monitoring & Observability

### 1. Health Checks

#### Backend Health Endpoint
```bash
# Test health check
curl https://your-backend-domain.com/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0"
}
```

#### Frontend Health Check
```javascript
// Add to your frontend
async function checkHealth() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    console.log('System health:', data);
  } catch (error) {
    console.error('Health check failed:', error);
  }
}
```

### 2. Logging

#### Backend Logging
```javascript
// Enhanced logging configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});
```

#### Log Aggregation
```bash
# Using Docker logs
docker-compose logs -f backend

# Using Railway logs
railway logs

# Using Render logs
# Available in Render dashboard
```

### 3. Metrics & Analytics

#### Custom Metrics Endpoint
```javascript
// Add to your backend
app.get('/api/metrics', async (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    activeConnections: server.connections,
    timestamp: new Date().toISOString()
  };
  res.json(metrics);
});
```

---

## 🔧 CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd server && npm ci
          cd ../client && npm ci
      
      - name: Run tests
        run: |
          cd server && npm test
          cd ../client && npm test
      
      - name: Build
        run: |
          cd server && npm run build
          cd ../client && npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          service: backend
          token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./client
```

### 2. Environment Variables Management

#### Railway CLI
```bash
# Set environment variables
railway variables set GROQ_API_KEY=gsk-your-key
railway variables set TOGETHER_API_KEY=your-together-key
railway variables set NEON_DATABASE_URL=your-neon-url
```

#### Vercel CLI
```bash
# Set environment variables
vercel env add VITE_API_BASE_URL
vercel env add VITE_CLERK_PUBLISHABLE_KEY
vercel env add VITE_CLOUDINARY_CLOUD_NAME
```

---

## 🚨 Production Checklist

### ✅ Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] CDN configured (optional)
- [ ] Monitoring setup
- [ ] Backup strategy defined

### ✅ Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] File uploads working
- [ ] Authentication working
- [ ] Chat functionality working
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Performance monitoring active

### ✅ Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Input validation active
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF protection

### ✅ Performance
- [ ] CDN configured
- [ ] Image optimization active
- [ ] Code splitting implemented
- [ ] Caching configured
- [ ] Database indexes optimized
- [ ] API response times < 2s
- [ ] Frontend load time < 3s

---

## 🔧 Troubleshooting

### Common Production Issues

#### 1. "GROQ_API_KEY not found"
```bash
# Check environment variables
railway variables list
# or
vercel env ls
```

#### 2. "Database connection failed"
```bash
# Check Neon database status
# Verify connection string
# Check SSL settings
```

#### 3. "Qdrant connection failed"
```bash
# Check Qdrant cluster status
# Verify API key permissions
# Check network connectivity
```

#### 4. "File uploads failing"
```bash
# Check Cloudinary credentials
# Verify file size limits
# Check network connectivity
```

#### 5. "Authentication errors"
```bash
# Check Clerk configuration
# Verify domain settings
# Check JWT configuration
```

### Performance Optimization

#### Backend Optimization
```javascript
// Enable compression
app.use(compression());

// Enable caching
app.use(cache('2 minutes', req => {
  return req.method === 'GET';
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

#### Frontend Optimization
```javascript
// Enable service worker
// Enable lazy loading
// Enable code splitting
// Enable image optimization
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers
- Implement session sharing
- Use Redis for caching
- Implement database read replicas

### Vertical Scaling
- Increase memory allocation
- Increase CPU allocation
- Optimize database queries
- Implement connection pooling

### Cost Optimization
- Use appropriate instance sizes
- Implement auto-scaling
- Monitor resource usage
- Optimize API calls

---

*This deployment guide reflects the current system architecture using modern AI/ML providers and cloud services.* 