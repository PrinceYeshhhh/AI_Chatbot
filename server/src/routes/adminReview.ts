import express from 'express';
import { getDeadLetterJobs, removeDeadLetterJob } from '../services/deadLetterQueue';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(getDeadLetterJobs());
});

router.delete('/:id', (req, res) => {
  removeDeadLetterJob(req.params.id);
  res.json({ success: true });
});

export default router; 