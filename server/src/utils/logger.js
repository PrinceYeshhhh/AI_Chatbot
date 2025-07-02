import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');

// Sensitive fields to redact from logs
const SENSITIVE_KEYS = ['OPENAI_API_KEY', 'DATABASE_URL', 'password', 'token', 'apiKey', 'fileContent', 'content'];

function redactSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key in clone) {
    if (SENSITIVE_KEYS.includes(key)) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object') {
      clone[key] = redactSensitive(clone[key]);
    }
  }
  return clone;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-chatbot-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

// Patch logger to redact sensitive info
const origError = logger.error.bind(logger);
logger.error = (...args) => {
  const redactedArgs = args.map(arg => typeof arg === 'object' ? redactSensitive(arg) : arg);
  origError(...redactedArgs);
};

const origWarn = logger.warn.bind(logger);
logger.warn = (...args) => {
  const redactedArgs = args.map(arg => typeof arg === 'object' ? redactSensitive(arg) : arg);
  origWarn(...redactedArgs);
};

const origInfo = logger.info.bind(logger);
logger.info = (...args) => {
  const redactedArgs = args.map(arg => typeof arg === 'object' ? redactSensitive(arg) : arg);
  origInfo(...redactedArgs);
};

/**
 * Utility to wrap async route handlers and forward errors to next()
 */
export function wrapAsync(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export { logger };