import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { permissionMiddleware } from '../middleware/permission.middleware';
import { analyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';

const router = express.Router();

// Middleware to ensure admin access
const adminOnly = permissionMiddleware('analytics');

// Get overall system statistics
router.get('/stats', authMiddleware, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await analyticsService.getSystemStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get system statistics' 
    });
  }
});

// Get daily statistics for charts
router.get('/daily', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await analyticsService.getDailyStats(days);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting daily stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get daily statistics' 
    });
  }
});

// Get top users by activity
router.get('/top-users', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await analyticsService.getTopUsers(limit);
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error getting top users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get top users' 
    });
  }
});

// Get event counts by type
router.get('/events', authMiddleware, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await analyticsService.getEventCounts();
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Error getting event counts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get event counts' 
    });
  }
});

// Get storage statistics
router.get('/storage', authMiddleware, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const storage = await analyticsService.getStorageStats();
    res.json({ success: true, data: storage });
  } catch (error) {
    logger.error('Error getting storage stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get storage statistics' 
    });
  }
});

// Get user-specific analytics
router.get('/user/:userId', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    // Placeholder for user-specific analytics data retrieval
    const userStats = {
      totalEvents: 0,
      events: [],
      lastActivity: null
    };

    res.json({ success: true, data: userStats });
  } catch (error) {
    logger.error('Error getting user analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user analytics' 
    });
  }
});

// Export analytics data as CSV
router.get('/export', authMiddleware, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { format = 'csv', days = 30 } = req.query;
    const daysNum = parseInt(days as string) || 30;
    
    const stats = await analyticsService.getDailyStats(daysNum);
    
    if (format === 'csv') {
      const csv = [
        'Date,File Uploads,Messages,Tokens,Cost,Active Users',
        ...stats.map(stat => 
          `${stat.date},${stat.fileUploads},${stat.messages},${stat.tokens},${stat.cost},${stat.activeUsers}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      res.send(csv);
    } else {
      res.json({ success: true, data: stats });
    }
  } catch (error) {
    logger.error('Error exporting analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export analytics data' 
    });
  }
});

// Log analytics event (for internal use)
router.post('/log', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, event_type, metadata, workspace_id, session_id } = req.body;
    
    await analyticsService.logEvent({
      user_id,
      event_type,
      metadata,
      workspace_id,
      session_id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.json({ success: true, message: 'Event logged successfully' });
  } catch (error) {
    logger.error('Error logging analytics event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log analytics event' 
    });
  }
});

export default router; 