import { Queue } from 'bullmq';
import { connection } from './redis';
import { MatchingJobData } from './types';

export const MATCHING_QUEUE_NAME = 'matching-queue';

export const matchingQueue = new Queue<MatchingJobData>(MATCHING_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function addMatchingJob(data: MatchingJobData) {
  return await matchingQueue.add(`match-${data.batchItemId}`, data);
}
