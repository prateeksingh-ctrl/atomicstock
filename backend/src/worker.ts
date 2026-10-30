import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function startWorker() {
  console.log('👷 Tier-1 Background Worker initialized. Polling for jobs...');

  setInterval(async () => {
    try {
      // FIX BUG-06: SELECT FOR UPDATE SKIP LOCKED MUST be inside $transaction.
      // Outside a transaction, PostgreSQL auto-commits the lock immediately after
      // the SELECT returns, making SKIP LOCKED completely ineffective.
      let pickedJobId: string | null = null;

      await prisma.$transaction(async (tx) => {
        const jobs = await tx.$queryRaw<any[]>`
          SELECT id, "taskType", payload FROM "JobQueue"
          WHERE status = 'PENDING'
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;

        if (jobs.length === 0) return;

        const job = jobs[0];
        pickedJobId = job.id;
        console.log(`\n📦 Picked up Job [${job.id}]: ${job.taskType}`);

        // Mark PROCESSING inside the same transaction — lock is held until commit
        // This guarantees no other worker can see this job as PENDING
        await tx.jobQueue.update({
          where: { id: job.id },
          data: { status: 'PROCESSING' }
        });
      });

      // Heavy lifting happens OUTSIDE the transaction to avoid long-held locks
      if (!pickedJobId) return;

      const processingJob = await prisma.jobQueue.findUnique({
        where: { id: pickedJobId }
      });

      if (!processingJob) return;

      const payload = typeof processingJob.payload === 'string'
        ? JSON.parse(processingJob.payload)
        : processingJob.payload as any;

      console.log(`⚙️  Generating PDF dispatch ticket for ${payload.quantity}x [${payload.sku}]...`);

      // Simulate heavy CPU work (e.g., PDF generation, shipping API ping)
      await new Promise(resolve => setTimeout(resolve, 3000));

      await prisma.jobQueue.update({
        where: { id: processingJob.id },
        data: { status: 'COMPLETED' }
      });

      console.log(`✅ Job [${processingJob.id}] completed successfully.`);

    } catch (error) {
      console.error('❌ Worker encountered a critical error:', error);
    }
  }, 2000);
}

startWorker();
