import dotenvSafe from 'dotenv-safe';
dotenvSafe.config();

export const config = {
  groq: {
    apiKey: process.env['GROQ_API_KEY'],
    baseUrl: 'https://api.groq.com/v1'
  },
  together: {
    apiKey: process.env['TOGETHER_API_KEY'],
    baseUrl: 'https://api.together.xyz'
  },
  qdrant: {
    url: process.env['QDRANT_URL'],
    apiKey: process.env['QDRANT_API_KEY']
  },
  openrouter: {
    apiKey: process.env['OPENROUTER_API_KEY'],
    baseUrl: 'https://openrouter.ai/api/v1'
  },
  libreTranslate: {
    url: process.env['LIBRETRANSLATE_URL']
  },
  clerk: {
    secretKey: process.env['CLERK_SECRET_KEY'],
    publishableKey: process.env['CLERK_PUBLISHABLE_KEY']
  },
  neon: {
    host: process.env['NEON_HOST'],
    port: process.env['NEON_PORT'],
    database: process.env['NEON_DATABASE'],
    user: process.env['NEON_USER'],
    password: process.env['NEON_PASSWORD']
  },
  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
    apiKey: process.env['CLOUDINARY_API_KEY'],
    apiSecret: process.env['CLOUDINARY_API_SECRET']
  },
  umami: {
    websiteId: process.env['UMAMI_WEBSITE_ID'],
    baseUrl: process.env['UMAMI_BASE_URL'],
    apiKey: process.env['UMAMI_API_KEY']
  },
  jwt: {
    secret: process.env['JWT_SECRET'],
    expiresIn: '7d'
  },
  server: {
    port: process.env['PORT'],
    nodeEnv: process.env['NODE_ENV']
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  }
};

export function validateConfig() {
  const requiredVars = [
    'GROQ_API_KEY',
    'TOGETHER_API_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'CLERK_SECRET_KEY',
    'NEON_HOST',
    'NEON_DATABASE',
    'NEON_USER',
    'NEON_PASSWORD',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'JWT_SECRET',
    'ENCRYPTION_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 