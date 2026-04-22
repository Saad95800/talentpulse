import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batchId = 'c4fa5765-f2b0-4553-af72-6ba4d7e0c9a4';
  const userId = '33c82125-376e-4a6f-935d-ce9b9886e000';

  console.log('--- Force Cleanup Start ---');

  // 1. Target specific batch
  const targetBatch = await prisma.batchJob.findUnique({ where: { id: batchId } });
  if (targetBatch) {
    console.log(`Killing batch ${batchId}...`);
    await prisma.batchItem.updateMany({
      where: { batchJobId: batchId },
      data: { status: 'FAILED', error: 'Force Stopped (Cleaning)' }
    });
    await prisma.batchJob.update({
      where: { id: batchId },
      data: { status: 'FAILED' }
    });
  }

  // 2. Kill ANY processing batch for this user
  console.log(`Killing all PROCESSING/PENDING batches for user ${userId}...`);
  const stuckBatches = await prisma.batchJob.findMany({
    where: { 
      userId, 
      status: { in: ['PENDING', 'PROCESSING'] } 
    }
  });

  for (const batch of stuckBatches) {
    console.log(`Cleaning up stuck batch: ${batch.id}`);
    await prisma.batchItem.updateMany({
      where: { batchJobId: batch.id },
      data: { status: 'FAILED', error: 'Cleaned up by system' }
    });
    await prisma.batchJob.update({
      where: { id: batch.id },
      data: { status: 'FAILED' }
    });
  }

  console.log('--- Force Cleanup Done ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
