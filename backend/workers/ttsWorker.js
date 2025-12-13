// backend/workers/ttsWorker.js
const { Worker } = require('bullmq');
const { connection } = require('../queues');
const EVENTS = require('../queues/events');

const worker = new Worker(
  'tts',
  async (job) => {
    if (job.name === EVENTS.AUDIO_REQUESTED) {
      console.log('[tts] job received:', job.data);
      // Real logic comes in Phase 5
    }
  },
  { connection }
);

worker.on('completed', job => {
  console.log(`[tts] job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[tts] job ${job.id} failed`, err.message);
});
