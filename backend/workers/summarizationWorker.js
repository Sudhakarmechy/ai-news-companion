// backend/workers/summarizationWorker.js
require('dotenv').config();

console.log('🔥 Summarization worker starting...');

const { Worker } = require('bullmq');
const EVENTS = require('../queues/events');

// ✅ PASS CONNECTION OPTIONS (NOT IORedis instance)
const worker = new Worker(
  'summarization',
 async (job) => {
  console.log('📥 SUMMARY JOB RECEIVED');
  console.log('   Job Name:', job.name);
  console.log('   Data:', JSON.stringify(job.data, null, 2));
},
  {
    connection: {
      host: '127.0.0.1',
      port: 6379,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`[summarization] job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[summarization] job ${job?.id} failed`, err.message);
});
