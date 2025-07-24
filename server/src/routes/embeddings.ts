import { Router } from 'express';
import { EmbeddingService } from '../services/embeddingService';
import { EmbeddingChunk } from '../types/embedding';

const router = Router();
const embeddingService = new EmbeddingService();

// POST /embeddings/batch
router.post('/batch', async (req, res) => {
  try {
    const embeddings: EmbeddingChunk[] = req.body.embeddings;
    await embeddingService.saveFileEmbeddings(embeddings);
    res.status(201).json({ message: 'Embeddings inserted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /embeddings/search
router.post('/search', async (req, res) => {
  const { userId, queryEmbedding, topK, fileId } = req.body;
  try {
    const results = await embeddingService.searchSimilarEmbeddings(userId, queryEmbedding, topK, fileId);
    res.json({ results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /embeddings/:userId/:fileId
router.delete('/:userId/:fileId', async (req, res) => {
  try {
    await embeddingService.deleteEmbeddingsForFile(req.params.fileId, req.params.userId);
    res.json({ message: 'Embeddings deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router; 