// backend/workers/summarizationWorker.js
require('dotenv').config();

console.log('🔥 Summarization worker starting...');

const { Worker } = require('bullmq');
const EVENTS = require('../queues/events');
const { summaryRepo, articleRepo } = require('../db');
const { Summary } = require('../models');
const { getLLMProvider } = require('../providers/llm');

const llm = getLLMProvider();

const worker = new Worker(
  'summarization',
  async (job) => {
    try {
      if (job.name !== EVENTS.SUMMARY_REQUESTED) {
        console.log('[summarization] Ignoring job with name:', job.name);
        return;
      }

      const { articleId, options } = job.data || {};
      if (!articleId) {
        console.error('[summarization] Missing articleId in job data');
        return;
      }
      if (!options || !options.mode || !options.language) {
        console.error('[summarization] Missing options (mode/language) in job data');
        return;
      }

      console.log(`[summarization] Processing article: ${articleId}`, options);

      const article = articleRepo.getArticleById(articleId);
      if (!article) {
        console.error('[summarization] Article not found:', articleId);
        return;
      }

      // Avoid duplicate summaries (per article + mode + language)
      const existing = summaryRepo
        .listByArticle(articleId)
        .find(
          s =>
            s.mode === options.mode &&
            s.language === options.language
        );

      if (existing) {
        console.log(
          `[summarization] ${options.mode} (${options.language}) summary already exists. Skipping.`
        );
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
        publishedAt: article.publishedAt || null,
        // Optional extra metadata:
        source: result.source || 'llm'
      });

      summaryRepo.upsertSummary(summary);

      console.log('[summarization] ✔ Summary generated:', summary.id);
      console.log('[summarization] Job data:', job.data);
    } catch (err) {
      console.error('[summarization] ❌ Error in worker job:', err.message, err.stack);
      throw err; // Let BullMQ mark job as failed
    }
  },
  {
    connection: { host: '127.0.0.1', port: 6379 },
    concurrency: 1
  }
);

worker.on('failed', (job, err) => {
  console.error('❌ Worker error:', err.message, 'for job', job?.id);
});

worker.on('completed', (job) => {
  console.log('✅ Worker completed job:', job.id);
});
