import * as Sentry from "@sentry/nextjs";
import { Worker } from 'bullmq';
import { connection } from './lib/queue/redis';
import { MATCHING_QUEUE_NAME } from './lib/queue/matching-queue';
import { matchingProcessor } from './lib/queue/processor';

// Initialisation Sentry pour le Worker (processus Node standalone)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://c23317701de4564c1a853511aa5a7638@o4511253273837568.ingest.de.sentry.io/4511253275344976",
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV || 'development',
});

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
