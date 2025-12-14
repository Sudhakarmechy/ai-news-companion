require('dotenv').config();
const { Worker } = require('bullmq');
const EVENTS = require('../queues/events');
const { publishSummaryRequested } = require('../queues/publishers');

console.log("🔥 Ingestion worker starting...");

const worker = new Worker(
  'ingestion',
  async (job) => {
    if (job.name !== EVENTS.ARTICLE_INGESTED) return;

    const { articleId } = job.data;

    console.log("[ingestionWorker] Received ARTICLE_INGESTED for", articleId);

    await publishSummaryRequested(articleId, {
      mode: "brief",
      language: "en"
    });
  },
  { connection: { host: "127.0.0.1", port: 6379 } }
);

worker.on('failed', (job, err) => {
  console.error("❌ Ingestion worker error:", err.message);
});
