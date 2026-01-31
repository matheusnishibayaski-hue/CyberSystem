import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { runSemgrep, runZap } from '../services/scans.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

new Worker('scan-queue', async job => {
  const { type, target } = job.data;
  if (type === 'semgrep') await runSemgrep(target);
  if (type === 'zap') await runZap(target);
}, { connection });
