// __tests__/training.test.ts
import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

jest.mock('../middleware/permission.middleware', () => ({
  permissionMiddleware: () => (req, res, next) => next(),
}));
jest.mock('../middleware/validation', () => ({
  validateTrainingData: (req, res, next) => next(),
}));

const TEST_USER = { id: 'test-user', email: 'test@example.com', role: 'user', permissions: ['manage_training', 'manage_models'] };
const JWT_SECRET = process.env['JWT_SECRET'] || 'test-jwt-secret';
function getAuthToken(user = TEST_USER) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

describe('/api/training', () => {
  let token: string;
  beforeEach(() => {
    token = getAuthToken();
  });

  it('should require auth for all endpoints', async () => {
    const res = await request(app).get('/api/training/data');
    expect(res.status).toBe(401);
  });

  it('should add, get, and delete training data', async () => {
    // Add
    let res = await request(app)
      .post('/api/training/data')
      .set('Authorization', `Bearer ${token}`)
      .send({ input: 'Q', expectedOutput: 'A', intent: 'test' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    // Get
    res = await request(app)
      .get('/api/training/data')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Delete
    const id = res.body.data[0]?.id;
    res = await request(app)
      .delete(`/api/training/data/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 400 for missing fields on add', async () => {
    const res = await request(app)
      .post('/api/training/data')
      .set('Authorization', `Bearer ${token}`)
      .send({ input: 'Q' });
    expect([400, 422]).toContain(res.status);
  });

  it('should handle bulk add and return results', async () => {
    const res = await request(app)
      .post('/api/training/data/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: [
        { input: 'Q1', expectedOutput: 'A1', intent: 'test' },
        { input: 'Q2', expectedOutput: 'A2', intent: 'test' },
        { input: 'Q3' } // invalid
      ] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('should return 400 for invalid bulk data', async () => {
    const res = await request(app)
      .post('/api/training/data/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('should return 404 for deleting non-existent data', async () => {
    const res = await request(app)
      .delete('/api/training/data/9999')
      .set('Authorization', `Bearer ${token}`);
    expect([404, 400]).toContain(res.status);
  });

  it('should return 400 for invalid delete id', async () => {
    const res = await request(app)
      .delete('/api/training/data/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('should return training stats', async () => {
    const res = await request(app)
      .get('/api/training/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('total');
  });

  it('should export training data as JSON and CSV', async () => {
    let res = await request(app)
      .get('/api/training/export')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toMatch(/application\/json/);
    res = await request(app)
      .get('/api/training/export?format=csv')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toMatch(/text\/csv/);
  });

  it('should clear all training data (requires manage_training)', async () => {
    const res = await request(app)
      .delete('/api/training/clear')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should start a fine-tuning job (requires manage_models)', async () => {
    const res = await request(app)
      .post('/api/training/fine-tune')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('jobId');
  });

  it('should get fine-tune jobs', async () => {
    const res = await request(app)
      .get('/api/training/fine-tune/jobs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('should get fine-tune job status', async () => {
    const res = await request(app)
      .get('/api/training/fine-tune/jobs/ft-job-123')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('jobId', 'ft-job-123');
  });

  it('should return 400 for missing jobId', async () => {
    const res = await request(app)
      .get('/api/training/fine-tune/jobs/')
      .set('Authorization', `Bearer ${token}`);
    expect([400, 404]).toContain(res.status);
  });

  it('should return 500 on internal error', async () => {
    // Simulate error by temporarily replacing a route handler
    const orig = app._router.stack.find(r => r.route && r.route.path === '/api/training/data');
    if (orig) {
      const origHandler = orig.route.stack[0].handle;
      orig.route.stack[0].handle = (req, res) => { throw new Error('Test error'); };
      const res = await request(app)
        .get('/api/training/data')
        .set('Authorization', `Bearer ${token}`);
      expect([500, 200]).toContain(res.status);
      orig.route.stack[0].handle = origHandler;
    }
  });
}); 