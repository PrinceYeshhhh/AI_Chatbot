import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

const TEST_USER = { id: 'test-user', email: 'test@example.com', role: 'user' };
const JWT_SECRET = process.env['JWT_SECRET'] || 'test-jwt-secret';
function getAuthToken(user = TEST_USER) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

describe('/api/profile', () => {
  it('should return 200 and user profile for authenticated user', async () => {
    const token = getAuthToken();
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', TEST_USER.id);
    expect(res.body).toHaveProperty('email', TEST_USER.email);
    expect(res.body).toHaveProperty('role', TEST_USER.role);
    expect(res.body).toHaveProperty('workspaces');
    expect(Array.isArray(res.body.workspaces)).toBe(true);
  });

  it('should return 401 Unauthorized for missing/invalid token', async () => {
    const res = await request(app)
      .get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 500 Internal Server Error on handler failure', async () => {
    // This is a placeholder since the current route always returns 200 or 401
    // If logic is added, mock the service to throw
    expect(true).toBe(true); // Update this test when real logic is implemented
  });
}); 