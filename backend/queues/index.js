// backend/queues/index.js
require('dotenv').config();

const { Queue } = require('bullmq');

const connection = {
  host: '127.0.0.1',
  port: 6379,
};

const queues = {
  ingestion: new Queue('ingestion', { connection }),
  summarization: new Queue('summarization', { connection }),
  tts: new Queue('tts', { connection }),
  digest: new Queue('digest', { connection }),
};

module.exports = { queues };
