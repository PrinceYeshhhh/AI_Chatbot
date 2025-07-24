interface DeadLetterJob {
  id: string;
  type: string;
  payload: any;
  retries: number;
  maxRetries: number;
  failedAt: string;
}

const deadLetterQueue: DeadLetterJob[] = [];

export function addDeadLetterJob(job: any) {
  deadLetterQueue.push({ ...job, failedAt: new Date().toISOString() });
}

export function getDeadLetterJobs() {
  return deadLetterQueue;
}

export function removeDeadLetterJob(id: string) {
  const idx = deadLetterQueue.findIndex(j => j.id === id);
  if (idx !== -1) deadLetterQueue.splice(idx, 1);
} 