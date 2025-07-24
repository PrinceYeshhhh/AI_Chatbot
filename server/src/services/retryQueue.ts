import { addDeadLetterJob } from './deadLetterQueue';
import { processVideoJob } from './videoService';

interface Job {
  id: string;
  type: string;
  payload: any;
  retries: number;
  maxRetries: number;
}

const queue: Job[] = [];

export function addJob(job: Omit<Job, 'retries'>) {
  queue.push({ ...job, retries: 0 });
}

export async function processNextJob(processor: (job: Job) => Promise<boolean>) {
  if (queue.length === 0) return;
  const job = queue.shift()!;
  try {
    const success = await processor(job);
    if (!success) onJobFailed(job);
  } catch {
    onJobFailed(job);
  }
}

function onJobFailed(job: Job) {
  if (job.retries + 1 >= job.maxRetries) {
    addDeadLetterJob(job);
  } else {
    queue.push({ ...job, retries: job.retries + 1 });
  }
}

// Background processor for video-processing jobs
export function startVideoJobProcessor() {
  setInterval(async () => {
    await processNextJob(async (job) => {
      if (job.type === 'video-processing') {
        return processVideoJob(job);
      }
      return true;
    });
  }, 2000); // every 2 seconds
} 