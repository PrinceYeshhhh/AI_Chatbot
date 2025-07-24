# PowerShell script to set up environment variables
Write-Host "🔑 Setting up environment variables for AI Chatbot Migration" -ForegroundColor Green
Write-Host ""

# Create .env file in server directory
$envPath = "server\.env"
$envContent = @"

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# LLM Services
GROQ_API_KEY=gsk_your_groq_api_key_here
TOGETHER_API_KEY=your_together_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Vector Database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=chatbot_embeddings

# Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Database
NEON_DATABASE_URL=postgresql://username:password@host:port/database

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Analytics
UMAMI_WEBSITE_ID=your_umami_website_id
UMAMI_SCRIPT_URL=https://your-umami-instance.com/umami.js

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Optional Services
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
"@

# Write the content to .env file
$envContent | Out-File -FilePath $envPath -Encoding UTF8

Write-Host "✅ Created $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Get your API keys from the services listed in API_SETUP_GUIDE.md" -ForegroundColor White
Write-Host "2. Replace the placeholder values in $envPath with your actual API keys" -ForegroundColor White
Write-Host "3. Run: cd server && npm install" -ForegroundColor White
Write-Host "4. Run: npm start" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "- Groq: https://console.groq.com" -ForegroundColor White
Write-Host "- Together.ai: https://together.ai" -ForegroundColor White
Write-Host "- Qdrant: https://cloud.qdrant.io" -ForegroundColor White
Write-Host "- Clerk: https://clerk.com" -ForegroundColor White
Write-Host "- Neon: https://neon.tech" -ForegroundColor White
Write-Host "- Firebase: https://console.firebase.google.com" -ForegroundColor White
Write-Host ""
Write-Host "💰 Total Cost: ~$460/month (86 percent savings from $3,300)" -ForegroundColor Green 