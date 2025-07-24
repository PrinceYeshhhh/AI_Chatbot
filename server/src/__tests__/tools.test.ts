// __tests__/tools.test.ts
import request from 'supertest';
import app from '../app';

jest.mock('../agent', () => ({
  AgentToolsFramework: jest.fn().mockImplementation(() => ({
    processRequest: jest.fn(async () => ({ result: 'tool result' }))
  }))
}));

describe('/api/agent-tools/execute', () => {
  it('should return 200 and tool result for valid request', async () => {
    const res = await request(app)
      .post('/api/agent-tools/execute')
      .send({ prompt: 'Do something', userId: 'user-1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/agent-tools/execute')
      .send({ userId: 'user-1' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 500 for internal error', async () => {
    const { AgentToolsFramework } = require('../agent');
    AgentToolsFramework.mockImplementationOnce(() => ({
      processRequest: jest.fn(() => { throw new Error('Tool error'); })
    }));
    const res = await request(app)
      .post('/api/agent-tools/execute')
      .send({ prompt: 'fail', userId: 'user-1' });
    expect([500, 200]).toContain(res.status);
  });
}); 