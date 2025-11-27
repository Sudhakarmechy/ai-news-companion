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

const QUEUE_NAME = 'tts';

// Create a single shared Queue instance (producer side)
const queue = new Queue(QUEUE_NAME, { connection });

module.exports = { queue, connection, QUEUE_NAME };
