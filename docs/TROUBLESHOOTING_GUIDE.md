# 🔧 Smart Brain AI Chatbot - Troubleshooting Guide

## 📋 Overview

This guide helps you diagnose and resolve common issues with the Smart Brain AI Chatbot system. The system uses **Groq** for chat completions, **Together AI** for embeddings, **Cloudinary** for file storage, and **Neon** for the database.

---

## 🚨 Common Issues & Solutions

### 1. Authentication Issues

#### Problem: "Unauthorized" or "Invalid token"
**Symptoms:**
- 401 errors on API calls
- Users can't log in
- JWT token validation fails

**Solutions:**
```bash
# Check Clerk configuration
1. Verify CLERK_SECRET_KEY in environment
2. Check CLERK_PUBLISHABLE_KEY in frontend
3. Ensure domain is configured in Clerk dashboard
4. Verify JWT settings

# Test authentication
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Debug Steps:**
```javascript
// Check JWT token
const token = 'your-jwt-token';
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('Token payload:', decoded);
```

---

### 2. AI/ML Service Issues

#### Problem: "GROQ_API_KEY not found"
**Symptoms:**
- Chat responses fail
- 500 errors on chat endpoints
- "API key not configured" errors

**Solutions:**
```bash
# Check environment variables
echo $GROQ_API_KEY

# Verify in .env file
cat .env | grep GROQ_API_KEY

# Test Groq API directly
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-70b-8192",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

**Debug Steps:**
```javascript
// Test Groq service
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

try {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: "Hello" }],
    model: "llama3-70b-8192",
  });
  console.log('Groq test successful:', completion.choices[0]);
} catch (error) {
  console.error('Groq test failed:', error);
}
```

#### Problem: "TOGETHER_API_KEY not found"
**Symptoms:**
- File uploads fail
- Embeddings not generated
- "Together AI API key not configured" errors

**Solutions:**
```bash
# Check environment variables
echo $TOGETHER_API_KEY

# Verify in .env file
cat .env | grep TOGETHER_API_KEY

# Test Together AI API
curl -X POST https://api.together.xyz/v1/embeddings \
  -H "Authorization: Bearer $TOGETHER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "togethercomputer/m2-bert-80M-8k-base",
    "input": "Hello world"
  }'
```

---

### 3. Database Issues

#### Problem: "Database connection failed"
**Symptoms:**
- 500 errors on database operations
- "Connection refused" errors
- User data not saving

**Solutions:**
```bash
# Check Neon database URL
echo $NEON_DATABASE_URL

# Test database connection
psql $NEON_DATABASE_URL -c "SELECT 1;"

# Check SSL settings
psql $NEON_DATABASE_URL -c "SHOW ssl;"
```

**Debug Steps:**
```javascript
// Test database connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connection successful:', res.rows[0]);
  }
});
```

#### Problem: "Table does not exist"
**Symptoms:**
- Database queries fail
- "relation does not exist" errors
- Missing tables

**Solutions:**
```sql
-- Check if tables exist
\dt

-- Create missing tables
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'processing',
  cloudinary_url TEXT,
  cloudinary_public_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. Vector Database Issues

#### Problem: "Qdrant connection failed"
**Symptoms:**
- File processing fails
- Embeddings not stored
- "Qdrant cluster not accessible" errors

**Solutions:**
```bash
# Check Qdrant URL and API key
echo $QDRANT_URL
echo $QDRANT_API_KEY

# Test Qdrant connection
curl -X GET "$QDRANT_URL/collections" \
  -H "api-key: $QDRANT_API_KEY"
```

**Debug Steps:**
```javascript
// Test Qdrant service
const { QdrantClient } = require('@qdrant/js-client-rest');

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

try {
  const collections = await client.getCollections();
  console.log('Qdrant connection successful:', collections);
} catch (error) {
  console.error('Qdrant connection failed:', error);
}
```

---

### 5. File Storage Issues

#### Problem: "Cloudinary upload failed"
**Symptoms:**
- File uploads fail
- "Cloudinary credentials invalid" errors
- Files not accessible

**Solutions:**
```bash
# Check Cloudinary credentials
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# Test Cloudinary upload
curl -X POST https://api.cloudinary.com/v1_1/$CLOUDINARY_CLOUD_NAME/image/upload \
  -F "file=@test.jpg" \
  -F "api_key=$CLOUDINARY_API_KEY" \
  -F "timestamp=$(date +%s)" \
  -F "signature=$(echo -n "timestamp=$(date +%s)" | openssl sha1 -hmac $CLOUDINARY_API_SECRET)"
```

**Debug Steps:**
```javascript
// Test Cloudinary service
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.uploader.upload('test.jpg', (error, result) => {
  if (error) {
    console.error('Cloudinary upload failed:', error);
  } else {
    console.log('Cloudinary upload successful:', result);
  }
});
```

---

### 6. Chat Functionality Issues

#### Problem: "Chat endpoint returns 403"
**Symptoms:**
- Chat requests fail
- "Forbidden" errors
- Authentication issues

**Solutions:**
```bash
# Check authentication middleware
# Verify JWT token
# Check user permissions

# Test with valid token
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

#### Problem: "LLM doesn't respond"
**Symptoms:**
- Chat requests timeout
- No response from AI
- "Model not available" errors

**Solutions:**
```bash
# Check Groq API status
curl https://api.groq.com/health

# Check API key credits
curl -X GET https://api.groq.com/v1/usage \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Test with different model
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-8b-8192",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

---

### 7. File Upload Issues

#### Problem: "Why can't I upload a file?"
**Symptoms:**
- File upload fails
- "File type not supported" errors
- Upload progress stuck

**Solutions:**
```bash
# Check file size limits
echo $MAX_FILE_SIZE

# Check allowed file types
# Supported: PDF, DOCX, TXT, CSV, XLSX, images, audio

# Test file upload
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@test.pdf"
```

**Debug Steps:**
```javascript
// Check file validation
const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'audio/mpeg'
];

console.log('File type allowed:', allowedTypes.includes(file.mimetype));
console.log('File size:', file.size);
console.log('Max size:', process.env.MAX_FILE_SIZE);
```

---

### 8. Performance Issues

#### Problem: "Slow response times"
**Symptoms:**
- API responses take > 5 seconds
- Frontend feels sluggish
- Timeout errors

**Solutions:**
```bash
# Check server resources
top
free -h
df -h

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/health"

# Monitor database performance
psql $NEON_DATABASE_URL -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Debug Steps:**
```javascript
// Add performance monitoring
const start = Date.now();
// ... your code ...
const duration = Date.now() - start;
console.log(`Operation took ${duration}ms`);

// Monitor memory usage
console.log('Memory usage:', process.memoryUsage());
```

---

### 9. Development Environment Issues

#### Problem: "Can't start development server"
**Symptoms:**
- `npm run dev` fails
- Port already in use
- Dependencies missing

**Solutions:**
```bash
# Check Node.js version
node --version  # Should be >= 18

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check if port is in use
lsof -i :3001
lsof -i :5173

# Kill process using port
kill -9 $(lsof -t -i:3001)
```

#### Problem: "TypeScript compilation errors"
**Symptoms:**
- Build fails
- Type errors
- Import errors

**Solutions:**
```bash
# Check TypeScript version
npx tsc --version

# Run type checking
npm run type-check

# Fix linting issues
npm run lint:fix

# Clear TypeScript cache
rm -rf dist node_modules/.cache
```

---

### 10. Production Deployment Issues

#### Problem: "Deployment failed"
**Symptoms:**
- Build errors
- Environment variables missing
- Service not starting

**Solutions:**
```bash
# Check build logs
railway logs
# or
vercel logs

# Verify environment variables
railway variables list
# or
vercel env ls

# Test build locally
npm run build
```

#### Problem: "SSL certificate issues"
**Symptoms:**
- HTTPS not working
- Certificate errors
- Mixed content warnings

**Solutions:**
```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Verify certificate chain
openssl x509 -in cert.pem -text -noout

# Check nginx SSL configuration
nginx -t
```

---

## 🔍 Debugging Tools

### 1. Logging Configuration
```javascript
// Enhanced logging
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

// Add request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});
```

### 2. Health Check Endpoints
```bash
# System health
curl http://localhost:3001/health

# API status
curl http://localhost:3001/api/status

# Service-specific health
curl http://localhost:3001/api/status/services/vector
curl http://localhost:3001/api/status/services/cache
```

### 3. Performance Monitoring
```javascript
// Add performance middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration
    });
  });
  next();
});
```

---

## 📞 Getting Help

### 1. Check Logs
```bash
# Backend logs
tail -f server/logs/combined.log

# Railway logs
railway logs

# Vercel logs
vercel logs
```

### 2. Common Error Codes
- **401**: Authentication required
- **403**: Forbidden (insufficient permissions)
- **404**: Endpoint not found
- **429**: Rate limit exceeded
- **500**: Internal server error
- **502**: Bad gateway
- **503**: Service unavailable

### 3. Support Resources
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Documentation](https://your-docs.com)
- [API Status](https://status.groq.com)

---

## ✅ Quick Fix Checklist

- [ ] Check environment variables
- [ ] Verify API keys are valid
- [ ] Test database connection
- [ ] Check service health endpoints
- [ ] Review error logs
- [ ] Test with minimal payload
- [ ] Verify network connectivity
- [ ] Check resource usage
- [ ] Restart services if needed

---

*This troubleshooting guide addresses issues specific to the current system architecture using Groq, Together AI, Cloudinary, and other modern providers.* 