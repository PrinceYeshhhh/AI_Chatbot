import express from 'express';
import { vectorService } from '../services/vectorService.js';
import { documentProcessor } from '../services/documentProcessor.js';
import { logger } from '../utils/logger.js';
import { validateTrainingData, validateBulkTrainingData } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

const router = express.Router();

// Per-IP rate limiter for training endpoint
const trainingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Too many training requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Throttle repeated requests
const trainingSpeedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 5, // allow 5 requests at full speed, then...
  delayMs: 1000, // ...add 1s per request above 5
});

/**
 * @openapi
 * /training:
 *   post:
 *     summary: Add a single training example
 *     tags:
 *       - Training
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *               expectedOutput:
 *                 type: string
 *               intent:
 *                 type: string
 *               confidence:
 *                 type: number
 *             required:
 *               - input
 *               - expectedOutput
 *               - intent
 *     responses:
 *       200:
 *         description: Training example added successfully
 *       400:
 *         description: Invalid training data
 *       429:
 *         description: Too many requests (rate limited)
 *       500:
 *         description: Failed to add training example
 *     security:
 *       - bearerAuth: []
 *
 * /training/bulk:
 *   post:
 *     summary: Add multiple training examples
 *     tags:
 *       - Training
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 input:
 *                   type: string
 *                 expectedOutput:
 *                   type: string
 *                 intent:
 *                   type: string
 *                 confidence:
 *                   type: number
 *     responses:
 *       200:
 *         description: Training examples processed
 *       207:
 *         description: Some training examples failed
 *       400:
 *         description: Invalid training data
 *       429:
 *         description: Too many requests (rate limited)
 *       500:
 *         description: Bulk training failed
 *     security:
 *       - bearerAuth: []
 *
 * /training/stats:
 *   get:
 *     summary: Get training statistics
 *     tags:
 *       - Training
 *     responses:
 *       200:
 *         description: Training and vector store stats
 *     security:
 *       - bearerAuth: []
 *
 * /training/clear:
 *   delete:
 *     summary: Clear all training data
 *     tags:
 *       - Training
 *     responses:
 *       200:
 *         description: All training data cleared
 *       500:
 *         description: Failed to clear training data
 *     security:
 *       - bearerAuth: []
 *
 * /training/{id}:
 *   delete:
 *     summary: Delete a specific training example
 *     tags:
 *       - Training
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Training example deleted
 *       500:
 *         description: Failed to delete training example
 *     security:
 *       - bearerAuth: []
 *
 * /training/export:
 *   get:
 *     summary: Export all training data
 *     tags:
 *       - Training
 *     responses:
 *       200:
 *         description: Exported training data
 *     security:
 *       - bearerAuth: []
 *
 * TODO: Document any additional endpoints or clarify ambiguous ones.
 */

// TODO: Consider adding persistent storage (e.g., database) for training metadata, not just vector DB.

// POST /api/training - Add single training example
router.post('/', trainingLimiter, trainingSpeedLimiter, validateTrainingData, async (req, res) => {
  try {
    const { input, expectedOutput, intent, confidence } = req.body;
    
    logger.info(`Adding training example: ${input.substring(0, 50)}...`);

    // Create training document
    const trainingContent = `Input: ${input}\nExpected Output: ${expectedOutput}\nIntent: ${intent}`;
    
    const processedDoc = await documentProcessor.processText(trainingContent, {
      filename: `training_${intent}_${Date.now()}.txt`,
      type: 'training_data',
      intent,
      confidence,
      input,
      expectedOutput
    });

    // Add to vector store
    const vectorIds = await vectorService.addDocuments([processedDoc]);

    res.json({
      message: 'Training example added successfully',
      result: {
        vectorIds,
        intent,
        confidence,
        chunks: processedDoc.chunks.length
      }
    });

  } catch (error) {
    logger.error('Error adding training example:', error);
    res.status(500).json({
      error: 'Failed to add training example',
      message: error.message
    });
  }
});

// POST /api/training/bulk - Add multiple training examples
router.post('/bulk', validateBulkTrainingData, async (req, res) => {
  try {
    const trainingData = req.body;
    
    logger.info(`Adding ${trainingData.length} training examples`);

    const results = [];
    const errors = [];

    for (let i = 0; i < trainingData.length; i++) {
      try {
        const { input, expectedOutput, intent, confidence } = trainingData[i];
        
        const trainingContent = `Input: ${input}\nExpected Output: ${expectedOutput}\nIntent: ${intent}`;
        
        const processedDoc = await documentProcessor.processText(trainingContent, {
          filename: `training_${intent}_${Date.now()}_${i}.txt`,
          type: 'training_data',
          intent,
          confidence,
          input,
          expectedOutput
        });

        const vectorIds = await vectorService.addDocuments([processedDoc]);

        results.push({
          index: i,
          intent,
          confidence,
          vectorIds,
          chunks: processedDoc.chunks.length
        });

      } catch (error) {
        logger.error(`Error processing training example ${i}:`, error);
        errors.push({
          index: i,
          error: error.message,
          data: trainingData[i]
        });
      }
    }

    const response = {
      message: `Processed ${results.length} training examples`,
      results,
      errors,
      summary: {
        total: trainingData.length,
        successful: results.length,
        failed: errors.length
      }
    };

    if (errors.length > 0) {
      res.status(207).json(response); // Multi-status
    } else {
      res.json(response);
    }

  } catch (error) {
    logger.error('Error in bulk training:', error);
    res.status(500).json({
      error: 'Bulk training failed',
      message: error.message
    });
  }
});

// GET /api/training/stats - Get training statistics
router.get('/stats', async (req, res) => {
  try {
    const vectorStats = await vectorService.getStats();
    
    // Get training-specific stats by querying vector store
    // This is a simplified implementation - in production you might want
    // to store training metadata separately
    
    res.json({
      vectorStore: vectorStats,
      training: {
        totalExamples: vectorStats.totalDocuments,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting training stats:', error);
    res.status(500).json({
      error: 'Failed to get training statistics',
      message: error.message
    });
  }
});

// DELETE /api/training/clear - Clear all training data
router.delete('/clear', async (req, res) => {
  try {
    logger.info('Clearing all training data');
    
    await vectorService.clear();
    
    res.json({
      message: 'All training data cleared successfully'
    });

  } catch (error) {
    logger.error('Error clearing training data:', error);
    res.status(500).json({
      error: 'Failed to clear training data',
      message: error.message
    });
  }
});

// DELETE /api/training/:id - Delete specific training example
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Deleting training example: ${id}`);
    
    // Delete from vector store by metadata
    await vectorService.deleteDocument(id);
    
    res.json({
      message: 'Training example deleted successfully',
      id
    });

  } catch (error) {
    logger.error('Error deleting training example:', error);
    res.status(500).json({
      error: 'Failed to delete training example',
      message: error.message
    });
  }
});

// GET /api/training/export - Export all training data
router.get('/export', async (req, res) => {
  try {
    logger.info('Exporting training data');
    
    // Get all documents from vector store
    const allDocs = await vectorService.getAllDocuments();
    
    // Filter and format training data
    const trainingData = allDocs
      .filter(doc => doc.metadata.type === 'training_data')
      .map(doc => ({
        id: doc.metadata.filename,
        input: doc.metadata.input || '',
        expectedOutput: doc.metadata.expectedOutput || '',
        intent: doc.metadata.intent || 'custom',
        confidence: doc.metadata.confidence || 0.98,
        dateAdded: doc.metadata.uploadedAt || new Date().toISOString(),
        validationStatus: 'validated'
      }));
    
    res.json({
      trainingData,
      count: trainingData.length,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error exporting training data:', error);
    res.status(500).json({
      error: 'Failed to export training data',
      message: error.message
    });
  }
});

export default router;