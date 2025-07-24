import express from 'express';
import imageUploadRouter from './imageUpload';
import audioUploadRouter from './audioUpload';
import analyticsDashboardRouter from './analyticsDashboard';
import userConfigRouter from './userConfig';
import adminConfigRouter from './adminConfig';
import pluginRegistryRouter from './pluginRegistry';
import adminReviewRouter from './adminReview';
import videoUploadRouter from './videoUpload';
import videoUploadStatusRouter from './videoUploadStatus';
import videoAnalyticsRouter from './videoAnalytics';
import embeddingsRouter from './embeddings';

const router = express.Router();

router.use('/image-upload', imageUploadRouter);
router.use('/audio-upload', audioUploadRouter);
router.use('/analytics-dashboard', analyticsDashboardRouter);
router.use('/user-config', userConfigRouter);
router.use('/admin-config', adminConfigRouter);
router.use('/plugins', pluginRegistryRouter);
router.use('/admin-review', adminReviewRouter);
router.use('/video-upload', videoUploadRouter);
router.use('/video-upload-status', videoUploadStatusRouter);
router.use('/video-analytics', videoAnalyticsRouter);
router.use('/embeddings', embeddingsRouter);

export default router; 