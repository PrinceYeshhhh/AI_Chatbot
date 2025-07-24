// __tests__/status.test.ts
import request from 'supertest';
import app from '../app';

jest.mock('../services/llmService', () => ({
  LLMService: jest.fn().mockImplementation(() => ({
    getVectorStats: jest.fn(async () => ({ status: 'healthy', vectors: 100 })),
  })),
}));
jest.mock('../services/cacheService', () => ({
  cacheService: { getStats: jest.fn(async () => ({ status: 'healthy', keys: 10 })) },
}));
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('/api/status', () => {
  it('should return 200 and system status for GET /api/status', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('services');
  });

  it('should return 200 and health info for GET /api/status/health', async () => {
    const res = await request(app).get('/api/status/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 200 and config info for GET /api/status/config', async () => {
    const res = await request(app).get('/api/status/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('nodeEnv');
  });

  it('should return 200 and vector service status for GET /api/status/services/vector', async () => {
    const res = await request(app).get('/api/status/services/vector');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('should return 200 and cache service status for GET /api/status/services/cache', async () => {
    const res = await request(app).get('/api/status/services/cache');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('should return 403 for GET /api/status/logs in production', async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/api/status/logs');
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
    process.env.NODE_ENV = oldEnv;
  });

  it('should return 200 and logs in development', async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/api/status/logs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('logs');
    process.env.NODE_ENV = oldEnv;
  });

  it('should return 500 if LLMService throws', async () => {
    const { LLMService } = require('../services/llmService');
    LLMService.mockImplementationOnce(() => ({
      getVectorStats: jest.fn(async () => { throw new Error('LLM error'); })
    }));
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });
}); 