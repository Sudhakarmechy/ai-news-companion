// backend/workers/summarizationWorker.js
require('dotenv').config();

console.log('🔥 Summarization worker starting...');

const { Worker } = require('bullmq');
const EVENTS = require('../queues/events');
const { summaryRepo, articleRepo } = require('../db');
const { Summary } = require('../models');
const { getLLMProvider } = require('../providers/llm');

const llm = getLLMProvider();

console.log("DEBUG Summary import:", require('../models').Summary);
const worker = new Worker(
  'summarization',
  async (job) => {
    if (job.name !== EVENTS.SUMMARY_REQUESTED) return;

    const { articleId, options } = job.data;

    console.log(`[summarization] Processing article: ${articleId}`);

    const article = articleRepo.getArticleById(articleId);
    if (!article) {
      console.error("[summarization] Article not found:", articleId);
      return;
    }

    // Avoid duplicate summaries
    const existing = summaryRepo.listByArticle(articleId);
    if (existing.length > 0) {
      console.log("[summarization] Already summarized. Skipping.");
      return;
    }

    // Generate summary from LLM
    const result = await llm.summarizeArticle(article, options);

    const summary = Summary.create({
  articleId,
  mode: options.mode,
  language: options.language,
  text: result.summary,
  hook: result.hook,
  question: result.question,
  createdAt: new Date().toISOString(),
});

    summaryRepo.upsertSummary(summary);

    console.log("[summarization] ✔ Summary generated:", summary.id);
    console.log("DEBUG JOB DATA:", job.data);
  },
  {
    connection: { host: '127.0.0.1', port: 6379 }
  }
);

worker.on('failed', (job, err) => {
  console.error("❌ Worker error:", err.message);
});
