// backend/worker-start.js
require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { runForArticle } = require('./ttsWorker');

// Ensure REDIS_URL matches the queue producer
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

const QUEUE_NAME = 'tts';

// Processor function for the worker
const processor = async (job) => {
  const { articleId, voicePreset = 'alloy', humorLevel = 3 } = job.data || {};
  console.log(`[worker] Received job ${job.id} for articleId=${articleId}`);
  // throw if missing id so job fails and can be retried
  if (!articleId) throw new Error('job missing articleId');

  const result = await runForArticle(articleId, voicePreset, humorLevel);
  return result;
};

// Create worker
const worker = new Worker(QUEUE_NAME, processor, { connection, concurrency: 2 });

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed.`);
});
worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job.id} failed:`, err?.message || err);
});

console.log('Worker started for queue:', QUEUE_NAME);

// Optional: handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});
