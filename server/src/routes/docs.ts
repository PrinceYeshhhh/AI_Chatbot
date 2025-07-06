import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const router = express.Router();

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Chatbot API',
      version: '1.0.0',
      description: 'A comprehensive API for an AI-powered chatbot with RAG capabilities, file upload, and training data management.',
      contact: {
        name: 'API Support',
        email: 'support@aichatbot.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'https://your-backend-name.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ChatMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The user message to send to the AI'
            },
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string' }
                }
              }
            },
            useRAG: {
              type: 'boolean',
              description: 'Whether to use RAG (Retrieval-Augmented Generation)',
              default: true
            }
          },
          required: ['message']
        },
        TrainingData: {
          type: 'object',
          properties: {
            input: { type: 'string', description: 'Training input text' },
            expectedOutput: { type: 'string', description: 'Expected response' },
            intent: { type: 'string', description: 'Intent classification' }
          },
          required: ['input', 'expectedOutput', 'intent']
        },
        FileUpload: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'File to upload (PDF, DOCX, TXT, MD, CSV)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/app.ts']
};

const specs = swaggerJsdoc(options);

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Chatbot API Documentation'
}));

// Serve OpenAPI spec as JSON
router.get('/swagger.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

export default router; 