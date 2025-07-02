import Joi from 'joi';

/**
 * Schema for validating the chat request body.
 * Ensures that 'message' is a non-empty string and 'history' is an array of objects.
 */
export const chatRequestSchema = Joi.object({
  message: Joi.string().required().messages({
    'string.base': '"message" should be a type of text',
    'string.empty': '"message" cannot be an empty field',
    'any.required': '"message" is a required field'
  }),
  history: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required()
    })
  ).optional().default([])
});

/**
 * Schema for validating required environment variables at startup.
 */
export const envSchema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  CORS_ORIGIN: Joi.string().uri({ allowRelative: true }).required(),
  ENABLE_HELMET: Joi.string().valid('true', 'false').required(),
  ENABLE_COMPRESSION: Joi.string().valid('true', 'false').required(),
  ENABLE_REQUEST_LOGGING: Joi.string().valid('true', 'false').required(),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).required(),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).required(),
  SLOW_DOWN_DELAY_MS: Joi.number().integer().min(0).required(),
  OPENAI_API_KEY: Joi.string().min(10).required(),
  OPENAI_MODEL: Joi.string().required(),
  OPENAI_EMBEDDING_MODEL: Joi.string().required(),
  OPENAI_TEMPERATURE: Joi.number().min(0).max(2).required(),
  OPENAI_MAX_TOKENS: Joi.number().integer().min(1).required(),
  VECTOR_SIMILARITY_THRESHOLD: Joi.number().min(0).max(1).required(),
  MAX_RETRIEVAL_RESULTS: Joi.number().integer().min(1).required(),
  DATABASE_URL: Joi.string().uri().optional(),
  LOG_LEVEL: Joi.string().valid('info', 'debug', 'warn', 'error').required(),
}).unknown(); // allow extra vars

/**
 * Validates process.env against envSchema. Throws error if invalid.
 */
export function validateEnv() {
  const { error } = envSchema.validate(process.env, { abortEarly: false });
  if (error) {
    throw new Error(
      `Environment variable validation error:\n${error.details.map(d => `- ${d.message}`).join('\n')}`
    );
  }
}

// Minimal placeholder for schemas
export const schemas = {}; 