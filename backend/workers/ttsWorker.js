// backend/workers/ttsWorker.js

require('dotenv').config();

const { Worker } = require('bullmq');
const EVENTS = require('../queues/events');
const { queues } = require('../queues');
const { runTTS } = require('../ttsWorker'); // this is your actual logic file

console.log("🎤 TTS Worker starting...");

// Create a single worker for the "tts" queue
new Worker(
  'tts',
  async (job) => {
    if (job.name === EVENTS.AUDIO_REQUESTED) {
      console.log('[ttsWorker] job received:', job.data);
      return runTTS(job);
    }
  },
  {
    connection: { host: '127.0.0.1', port: 6379 },
    concurrency: 1
  }
)
  .on('completed', (job) => {
    console.log(`[ttsWorker] Job ${job.id} completed`);
  })
  .on('failed', (job, err) => {
    console.error(`[ttsWorker] Job ${job?.id} failed`, err?.message);
  });
