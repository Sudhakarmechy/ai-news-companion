// backend/queue.js
require('dotenv').config();
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Use host.docker.internal for Docker on Windows; otherwise use localhost
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// ✅ Create multiple queues object for compatibility
const queues = {
  tts: new Queue('tts', { connection })
};

// Also export the default queue (named 'tts' for backward compatibility)
const queue = queues.tts;

module.exports = { 
  queue, 
  queues,  // ✅ Added queues export
  connection, 
  QUEUE_NAME: 'tts' 
};
