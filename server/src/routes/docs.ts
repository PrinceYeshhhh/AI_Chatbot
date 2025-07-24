import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const router = express.Router();

// Enhanced Swagger configuration
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Brain AI Chatbot API',
    version: '1.0.0',
    description: 'Complete API documentation for the Smart Brain AI Chatbot system using Groq, Together AI, Cloudinary, and other modern providers',
    contact: {
      name: 'API Support',
      email: 'support@smartbrain.com',
      url: 'https://github.com/your-repo/issues'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server'
    },
    {
      url: 'https://your-backend.railway.app/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from authentication endpoints'
      }
    },
    schemas: {
      ChatRequest: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'User message',
            example: 'What is machine learning?'
          },
          sessionId: {
            type: 'string',
            description: 'Optional session ID',
            example: 'session_123'
          },
          mode: {
            type: 'string',
            enum: ['auto', 'chat', 'search'],
            description: 'Chat mode',
            example: 'auto'
          },
          fileFilter: {
            type: 'string',
            description: 'File filter for context',
            example: 'recent'
          },
          workspace_id: {
            type: 'string',
            description: 'Workspace ID',
            example: 'workspace_456'
          }
        },
        required: ['message']
      },
      ChatResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          response: {
            type: 'string',
            description: 'AI response',
            example: 'Machine learning is a subset of artificial intelligence...'
          },
          context: {
            type: 'object',
            properties: {
              retrievedDocuments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    content: { type: 'string' },
                    score: { type: 'number' }
                  }
                }
              },
              mode: { type: 'string' },
              tokensUsed: { type: 'number' }
            }
          },
          metadata: {
            type: 'object',
            properties: {
              modelUsed: { type: 'string' },
              responseTime: { type: 'number' },
              confidence: { type: 'number' }
            }
          }
        }
      },
      UploadResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Files uploaded and processed successfully'
          },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                originalName: { type: 'string' },
                filename: { type: 'string' },
                size: { type: 'number' },
                mimetype: { type: 'string' },
                cloudinaryUrl: { type: 'string' },
                chunks: { type: 'number' },
                status: { type: 'string' }
              }
            }
          },
          vectorStats: {
            type: 'object',
            properties: {
              totalDocuments: { type: 'number' },
              totalChunks: { type: 'number' },
              collectionSize: { type: 'string' }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            description: 'Error message'
          },
          message: {
            type: 'string',
            description: 'Detailed error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Chat',
      description: 'AI chat and conversation endpoints'
    },
    {
      name: 'File Upload',
      description: 'File upload and processing endpoints'
    },
    {
      name: 'Training',
      description: 'Training data management endpoints'
    },
    {
      name: 'Agent Tools',
      description: 'AI agent and tool execution endpoints'
    },
    {
      name: 'Analytics',
      description: 'Analytics and metrics endpoints'
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints (admin only)'
    },
    {
      name: 'Health',
      description: 'System health and status endpoints'
    }
  ]
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/routes/api.ts',
    './src/routes/chat.ts',
    './src/routes/upload.ts',
    './src/routes/auth.ts',
    './src/routes/training.ts',
    './src/routes/agentTool.ts',
    './src/routes/analytics.ts',
    './src/routes/status.ts'
  ],
  explorer: true
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Enhanced Swagger UI setup
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Smart Brain AI Chatbot API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add default headers
      req.headers['Content-Type'] = 'application/json';
      return req;
    },
    responseInterceptor: (res: any) => {
      // Format responses
      return res;
    }
  }
};

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// API documentation info
router.get('/info', (req: Request, res: Response) => {
  res.json({
    title: 'Smart Brain AI Chatbot API',
    version: '1.0.0',
    description: 'Complete API documentation for the Smart Brain AI Chatbot system',
    providers: {
      chat: 'Groq (Llama3-70b-8192)',
      embeddings: 'Together AI (m2-bert-80M-8k-base)',
      storage: 'Cloudinary',
      database: 'Neon PostgreSQL',
      vector: 'Qdrant Cloud',
      auth: 'Clerk.dev'
    },
    endpoints: {
      authentication: '/api/auth/*',
      chat: '/api/chat/*',
      upload: '/api/upload',
      training: '/api/training/*',
      agentTools: '/api/agent-tools/*',
      analytics: '/api/analytics/*',
      admin: '/api/admin/*',
      health: '/api/status/*'
    },
    documentation: {
      swagger: '/api/docs',
      postman: '/api/docs/postman',
      openapi: '/api/docs/openapi.json'
    }
  });
});

// Serve OpenAPI specification
router.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Postman collection endpoint
router.get('/postman', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=smart-brain-api.postman_collection.json');
  
  // Return the Postman collection
  const postmanCollection = {
    info: {
      name: 'Smart Brain AI Chatbot API',
      description: 'Complete API collection for the Smart Brain AI Chatbot system',
      version: '1.0.0',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
      {
        key: 'base_url',
        value: 'http://localhost:3001',
        type: 'string'
      },
      {
        key: 'jwt_token',
        value: 'your_jwt_token_here',
        type: 'string'
      }
    ],
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Register User',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
              },
              url: '{{base_url}}/api/register'
            }
          },
          {
            name: 'Login User',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: '{"email": "test@example.com", "password": "password123"}'
              },
              url: '{{base_url}}/api/login'
            }
          }
        ]
      },
      {
        name: 'Chat',
        item: [
          {
            name: 'Test Chat',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: '{"message": "Hello, how are you?"}'
              },
              url: '{{base_url}}/api/test-chat'
            }
          },
          {
            name: 'Smart Chat',
            request: {
              method: 'POST',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
              ],
              body: {
                mode: 'raw',
                raw: '{"message": "What is machine learning?", "sessionId": "session_123"}'
              },
              url: '{{base_url}}/api/chat/smart'
            }
          }
        ]
      }
    ]
  };
  
  res.json(postmanCollection);
});

// API examples endpoint
router.get('/examples', (req: Request, res: Response) => {
  res.json({
    examples: {
      chat: {
        request: {
          method: 'POST',
          url: '/api/chat',
          headers: {
            'Authorization': 'Bearer your_jwt_token',
            'Content-Type': 'application/json'
          },
          body: {
            message: 'What is machine learning?',
            sessionId: 'session_123',
            mode: 'auto'
          }
        },
        response: {
          success: true,
          response: 'Machine learning is a subset of artificial intelligence...',
          context: {
            retrievedDocuments: [],
            mode: 'auto',
            tokensUsed: 1500
          }
        }
      },
      upload: {
        request: {
          method: 'POST',
          url: '/api/upload',
          headers: {
            'Authorization': 'Bearer your_jwt_token'
          },
          body: 'multipart/form-data with files'
        },
        response: {
          success: true,
          message: 'Files uploaded and processed successfully',
          files: [
            {
              originalName: 'document.pdf',
              filename: 'document-1234567890.pdf',
              size: 1024000,
              status: 'processed'
            }
          ]
        }
      }
    }
  });
});

// Health check for docs service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'docs',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      swagger: '/api/docs',
      openapi: '/api/docs/openapi.json',
      postman: '/api/docs/postman',
      info: '/api/docs/info',
      examples: '/api/docs/examples'
    }
  });
});

export default router; 