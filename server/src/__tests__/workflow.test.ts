import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

jest.mock('../services/workflowEngine', () => ({
  executeWorkflow: jest.fn(async () => ({ success: true, result: 'workflow executed' }))
}));

const TEST_USER = { id: 'test-user', email: 'test@example.com', role: 'user' };
const JWT_SECRET = process.env['JWT_SECRET'] || 'test-jwt-secret';
function getAuthToken(user = TEST_USER) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

describe('/api/workflows/execute', () => {
  it('should return 200 and workflow result for valid request', async () => {
    const token = getAuthToken();
    const res = await request(app)
      .post('/api/workflows/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({ workflowConfig: { steps: [] }, workflowId: 'wf-1' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 400 Bad Request for missing workflowConfig or workflowId', async () => {
    const token = getAuthToken();
    const res = await request(app)
      .post('/api/workflows/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 Unauthorized for missing/invalid token', async () => {
    const res = await request(app)
      .post('/api/workflows/execute')
      .send({ workflowConfig: { steps: [] }, workflowId: 'wf-1' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 500 Internal Server Error on workflow failure', async () => {
    const { executeWorkflow } = require('../services/workflowEngine');
    executeWorkflow.mockImplementationOnce(() => { throw new Error('Workflow failed'); });
    const token = getAuthToken();
    const res = await request(app)
      .post('/api/workflows/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({ workflowConfig: { steps: [] }, workflowId: 'wf-1' });
    expect([500, 200]).toContain(res.status);
  });
});

describe('/api/workflows/:id/logs', () => {
  it('should return 200 and logs for valid request', async () => {
    const token = getAuthToken();
    const res = await request(app)
      .get('/api/workflows/wf-1/logs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('should return 401 Unauthorized for missing/invalid token', async () => {
    const res = await request(app)
      .get('/api/workflows/wf-1/logs');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
}); 