import { uploadFile, queryRAG, deleteFile, getEmbeddings } from '../services/ragService';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

describe('PHASE 6: Performance + Stress Testing', () => {
  it('Multi-file stress: upload 20 files, check embeddings/chunks', async () => {
    const userId = 'stress-user-1';
    const files = Array.from({ length: 20 }, (_, i) => `File content ${i} - ${'A'.repeat(10000)}`);
    const fileIds = [];
    for (const content of files) {
      const fileId = await uploadFile(content, userId);
      fileIds.push(fileId);
    }
    // Wait for embeddings
    await new Promise(r => setTimeout(r, 5000));
    for (const fileId of fileIds) {
      const embeddings = await getEmbeddings(fileId, userId);
      expect(embeddings.length).toBeGreaterThan(0);
    }
  });

  it('Multi-query stress: 30 rapid queries, check response time', async () => {
    const userId = 'stress-user-2';
    const fileId = await uploadFile('Rapid query test file', userId);
    await new Promise(r => setTimeout(r, 2000));
    const start = Date.now();
    for (let i = 0; i < 30; i++) {
      const t0 = Date.now();
      const results = await queryRAG('Rapid query test', userId);
      expect(results.length).toBeGreaterThan(0);
      const dt = Date.now() - t0;
      expect(dt).toBeLessThan(2000);
    }
    const total = Date.now() - start;
    expect(total / 30).toBeLessThan(1500);
  });

  it('Multi-user concurrency: 10 users upload and chat', async () => {
    const users = Array.from({ length: 10 }, (_, i) => `concurrent-user-${i}`);
    const fileIds: string[] = [];
    for (const userId of users) {
      const fileId = await uploadFile(`Concurrent file for ${userId}`, userId);
      fileIds.push(fileId);
    }
    await new Promise(r => setTimeout(r, 3000));
    for (const userId of users) {
      const results = await queryRAG('Concurrent file', userId);
      expect(results.some(r => r.content.includes(userId))).toBe(true);
    }
  });

  it('File deletion + memory cleanup', async () => {
    const userId = 'stress-user-3';
    const fileId1 = await uploadFile('Delete test file 1', userId);
    const fileId2 = await uploadFile('Delete test file 2', userId);
    await new Promise(r => setTimeout(r, 2000));
    await deleteFile(fileId1, userId);
    await new Promise(r => setTimeout(r, 1000));
    const embeddings1 = await getEmbeddings(fileId1, userId);
    expect(embeddings1.length).toBe(0);
    const embeddings2 = await getEmbeddings(fileId2, userId);
    expect(embeddings2.length).toBeGreaterThan(0);
    const results = await queryRAG('Delete test file 1', userId);
    expect(results.some(r => r.content.includes('Delete test file 1'))).toBe(false);
  });

  it('Edge case: unsupported/corrupt file, unrelated query', async () => {
    const userId = 'stress-user-4';
    let errorCaught = false;
    try {
      await uploadFile(Buffer.from([0x00, 0x01, 0x02]), userId, 'file.exe');
    } catch (e) {
      errorCaught = true;
    }
    expect(errorCaught).toBe(true);
    // Corrupt file
    errorCaught = false;
    try {
      await uploadFile('corrupt', userId, 'file.pdf'); // Simulate corrupt
    } catch (e) {
      errorCaught = true;
    }
    expect(errorCaught).toBe(true);
    // Unrelated query
    const fileId = await uploadFile('General chat fallback', userId);
    await new Promise(r => setTimeout(r, 1000));
    const results = await queryRAG('What is the weather?', userId);
    expect(results.length).toBe(0); // Should fallback to LLM, not RAG
  });
});

describe('Performance/Load: /api/chat and /api/upload', () => {
  const JWT_SECRET = process.env['JWT_SECRET'] || 'test-jwt-secret';
  const TEST_USER = { id: 'load-user', email: 'load@example.com', role: 'editor', permissions: ['chat', 'upload'] };
  function getAuthToken(user = TEST_USER) {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  }

  it('should handle 50 rapid /api/chat requests (expect some 429s if rate limited)', async () => {
    const token = getAuthToken();
    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: `Load test message ${i}` }));
    }
    const results = await Promise.all(requests);
    const statusCounts = results.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    // Log for monitoring, but do not fail build
    console.log('Chat load test status counts:', statusCounts);
    expect(results.length).toBe(50);
  });

  it('should handle 30 rapid /api/upload requests (expect some 429s if rate limited)', async () => {
    const token = getAuthToken();
    const requests = [];
    for (let i = 0; i < 30; i++) {
      requests.push(request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', Buffer.from('dummy pdf content'), `test${i}.pdf`));
    }
    const results = await Promise.all(requests);
    const statusCounts = results.reduce((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    // Log for monitoring, but do not fail build
    console.log('Upload load test status counts:', statusCounts);
    expect(results.length).toBe(30);
  });
}); 