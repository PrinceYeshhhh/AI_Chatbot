#!/usr/bin/env node

/**
 * Post-install script for AI Chatbot
 * Automatically configures development environment and generates necessary files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Running post-install setup for AI Chatbot...');

// Check if we're in a development environment
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Create necessary directories
 */
function createDirectories() {
  const dirs = [
    'uploads',
    'embeddings', 
    'models',
    'logs',
    'temp'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

/**
 * Generate environment file if it doesn't exist
 */
function setupEnvironment() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('⚠️  Please update .env with your API keys and configuration');
  }
}

/**
 * Check for and generate Prisma client if schema exists
 */
function setupPrisma() {
  const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  
  if (fs.existsSync(prismaSchemaPath)) {
    try {
      console.log('📦 Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.warn('⚠️  Failed to generate Prisma client:', error.message);
    }
  }
}

/**
 * Check for and setup Drizzle ORM if config exists
 */
function setupDrizzle() {
  const drizzleConfigPath = path.join(process.cwd(), 'drizzle.config.ts');
  
  if (fs.existsSync(drizzleConfigPath)) {
    try {
      console.log('📦 Setting up Drizzle ORM...');
      execSync('npx drizzle-kit generate:pg', { stdio: 'inherit' });
      console.log('✅ Drizzle migrations generated successfully');
    } catch (error) {
      console.warn('⚠️  Failed to setup Drizzle ORM:', error.message);
    }
  }
}

/**
 * Setup Git hooks for development
 */
function setupGitHooks() {
  if (!isDev) return;

  const huskyPath = path.join(process.cwd(), 'node_modules', '.bin', 'husky');
  
  if (fs.existsSync(huskyPath)) {
    try {
      execSync('npx husky install', { stdio: 'inherit' });
      console.log('✅ Git hooks installed with Husky');
    } catch (error) {
      console.warn('⚠️  Failed to install Git hooks:', error.message);
    }
  }
}

/**
 * Validate required dependencies
 */
function validateDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    'react',
    'typescript',
    'vite',
    'tailwindcss',
    'lucide-react'
  ];

  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
  );

  if (missingDeps.length > 0) {
    console.warn('⚠️  Missing recommended dependencies:', missingDeps.join(', '));
  } else {
    console.log('✅ All required dependencies found');
  }
}

/**
 * Create initial configuration files
 */
function createConfigFiles() {
  // Create nginx.conf for Docker deployment
  const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    server {
        listen       80;
        server_name  localhost;
        
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy (if needed)
        location /api/ {
            proxy_pass http://backend:3001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }
}
`;

  const nginxPath = path.join(process.cwd(), 'nginx.conf');
  if (!fs.existsSync(nginxPath)) {
    fs.writeFileSync(nginxPath, nginxConfig.trim());
    console.log('✅ Created nginx.conf for Docker deployment');
  }

  // Create Prometheus configuration
  const prometheusConfig = `
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ai-chatbot'
    static_configs:
      - targets: ['ai-chatbot:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
`;

  const prometheusPath = path.join(process.cwd(), 'prometheus.yml');
  if (!fs.existsSync(prometheusPath)) {
    fs.writeFileSync(prometheusPath, prometheusConfig.trim());
    console.log('✅ Created prometheus.yml for monitoring');
  }
}

/**
 * Display setup completion message
 */
function displayCompletionMessage() {
  console.log('\n🎉 Post-install setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Update .env file with your API keys');
  console.log('2. Run "npm run dev" to start development server');
  console.log('3. Visit http://localhost:5173 to see your chatbot');
  console.log('\n📚 Documentation:');
  console.log('- README.md - Getting started guide');
  console.log('- docs/Architecture.md - System architecture');
  console.log('- docs/TrainingGuide.md - Model training guide');
  console.log('\n🐳 Docker deployment:');
  console.log('- Run "docker-compose up" for full stack deployment');
  console.log('- Or "docker build -t ai-chatbot . && docker run -p 3000:80 ai-chatbot"');
}

/**
 * Main setup function
 */
function main() {
  try {
    createDirectories();
    setupEnvironment();
    validateDependencies();
    setupPrisma();
    setupDrizzle();
    setupGitHooks();
    createConfigFiles();
    displayCompletionMessage();
  } catch (error) {
    console.error('❌ Post-install setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
main();