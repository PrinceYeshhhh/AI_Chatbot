import express from 'express';
import { vectorService } from '../services/vectorService.js';
import { documentProcessor } from '../services/documentProcessor.js';
import { logger } from '../utils/logger.js';
import { validateTrainingData, validateBulkTrainingData } from '../middleware/validation.js';

const router = express.Router();

// POST /api/training - Add single training example
router.post('/', validateTrainingData, async (req, res) => {
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

export default router;