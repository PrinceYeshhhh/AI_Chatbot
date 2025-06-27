import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Chat request validation schema
const chatRequestSchema = Joi.object({
  message: Joi.string().required().min(1).max(4000).trim(),
  conversationHistory: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      content: Joi.string().required(),
      sender: Joi.string().valid('user', 'bot').required(),
      timestamp: Joi.date().required(),
      status: Joi.string().valid('sending', 'sent', 'failed').optional(),
      intent: Joi.string().optional()
    })
  ).optional().default([]),
  useContext: Joi.boolean().optional().default(true)
});

// Training data validation schema
const trainingDataSchema = Joi.object({
  input: Joi.string().required().min(1).max(1000).trim(),
  expectedOutput: Joi.string().required().min(1).max(4000).trim(),
  intent: Joi.string().required().min(1).max(100).trim(),
  confidence: Joi.number().min(0).max(1).optional().default(0.98)
});

export const validateChatRequest = (req, res, next) => {
  const { error, value } = chatRequestSchema.validate(req.body);
  
  if (error) {
    logger.warn('Chat request validation failed:', error.details);
    return res.status(400).json({
      error: 'Invalid request data',
      message: error.details[0].message,
      details: error.details
    });
  }
  
  req.body = value;
  next();
};

export const validateTrainingData = (req, res, next) => {
  const { error, value } = trainingDataSchema.validate(req.body);
  
  if (error) {
    logger.warn('Training data validation failed:', error.details);
    return res.status(400).json({
      error: 'Invalid training data',
      message: error.details[0].message,
      details: error.details
    });
  }
  
  req.body = value;
  next();
};

export const validateBulkTrainingData = (req, res, next) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({
      error: 'Invalid request format',
      message: 'Request body must be an array of training data objects'
    });
  }

  const errors = [];
  const validatedData = [];

  req.body.forEach((item, index) => {
    const { error, value } = trainingDataSchema.validate(item);
    
    if (error) {
      errors.push({
        index,
        errors: error.details.map(detail => detail.message)
      });
    } else {
      validatedData.push(value);
    }
  });

  if (errors.length > 0) {
    logger.warn('Bulk training data validation failed:', errors);
    return res.status(400).json({
      error: 'Invalid training data',
      message: `${errors.length} items failed validation`,
      validationErrors: errors
    });
  }

  req.body = validatedData;
  next();
};