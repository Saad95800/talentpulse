import { Worker } from 'bullmq';
import { connection } from './lib/queue/redis';
import { MATCHING_QUEUE_NAME } from './lib/queue/matching-queue';
import { matchingProcessor } from './lib/queue/processor';

console.log('--------------------------------------------------');
console.log('🚀 Démarrage du Worker TalentPulse...');
console.log(`📡 Connexion Redis: ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`);
console.log(`📥 File d'attente: ${MATCHING_QUEUE_NAME}`);
console.log('--------------------------------------------------');

const worker = new Worker(MATCHING_QUEUE_NAME, matchingProcessor, {
  connection,
  concurrency: 1, // Traitement un par un comme demandé
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} terminé !`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} a échoué: ${err.message}`);
});

process.on('SIGTERM', async () => {
  console.log('Gracefully closing worker...');
  await worker.close();
  process.exit(0);
});
