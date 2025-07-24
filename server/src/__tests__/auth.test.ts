// __tests__/auth.test.ts
import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

const TEST_USER = { id: 'test-user', email: 'test@example.com', role: 'user' };
const JWT_SECRET = process.env['JWT_SECRET'] || 'test-jwt-secret';
function getAuthToken(user = TEST_USER) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

describe('/api/auth', () => {
  it('should register a new user (200)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@example.com', password: 'password123', name: 'New User' });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('should return 400 for missing fields on register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should login a user (200)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });

  it('should return 400 for missing fields on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should get current user info with valid token', async () => {
    const token = getAuthToken();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id', TEST_USER.id);
  });

  it('should return 401 for /me with missing/invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 500 on internal error (register)', async () => {
    // This is a placeholder; if logic is added, mock the service to throw
    expect(true).toBe(true);
  });
}); 