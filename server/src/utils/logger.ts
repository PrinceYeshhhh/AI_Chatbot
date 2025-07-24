// NOTE: Requires 'winston' package. Run: npm install winston
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/server.log' })
  ]
});

export function logEvent(eventType: string, details: Record<string, any>) {
  logger.info({ eventType, ...details });
}

export function logError(eventType: string, details: Record<string, any>) {
  logger.error({ eventType, ...details });
}

export default logger; 