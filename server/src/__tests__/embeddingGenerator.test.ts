import { generateEmbeddings } from '../utils/generateEmbeddings';

describe('Embedding Generator Layer', () => {
  it('returns a valid 384-dim vector for a single chunk', async () => {
    // Mock fetch to simulate embedding microservice
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [Array(384).fill(0.5)] })
    });
    const chunk = {
      chunk: "Newton’s Laws are the foundation of classical mechanics.",
      metadata: { userId: 'u1', fileId: 'f1', chunkIndex: 0, modality: 'text' }
    };
    const result = await generateEmbeddings([chunk]);
    expect(result.length).toBe(1);
    expect(Array.isArray(result[0].embedding)).toBe(true);
    expect(result[0].embedding.length).toBe(384);
    expect(result[0].metadata.userId).toBe('u1');
    expect(result[0].metadata.fileId).toBe('f1');
    expect(result[0].metadata.chunkIndex).toBe(0);
    expect(result[0].metadata.modality).toBe('text');
  });

  it('returns 20 embeddings for 20 chunks with metadata', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: Array(20).fill(Array(384).fill(0.1)) })
    });
    const chunks = Array.from({ length: 20 }, (_, i) => ({
      chunk: `Chunk ${i + 1} content for embedding test`,
      metadata: { userId: 'u2', fileId: 'f2', chunkIndex: i, modality: 'text' }
    }));
    const result = await generateEmbeddings(chunks);
    expect(result.length).toBe(20);
    for (let i = 0; i < 20; i++) {
      expect(result[i].embedding.length).toBe(384);
      expect(result[i].metadata.chunkIndex).toBe(i);
      expect(result[i].metadata.userId).toBe('u2');
      expect(result[i].metadata.fileId).toBe('f2');
    }
  });

  it('skips malformed or empty content', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [Array(384).fill(0.2)] })
    });
    const chunks = [
      { chunk: '', metadata: { userId: 'u3', fileId: 'f3', chunkIndex: 0 } },
      { chunk: '!!!@@@###', metadata: { userId: 'u3', fileId: 'f3', chunkIndex: 1 } },
      { chunk: 'Valid text chunk.', metadata: { userId: 'u3', fileId: 'f3', chunkIndex: 2 } }
    ];
    const result = await generateEmbeddings(chunks);
    expect(result.length).toBe(1);
    expect(result[0].metadata.chunkIndex).toBe(2);
    expect(result[0].embedding.length).toBe(384);
  });
}); 