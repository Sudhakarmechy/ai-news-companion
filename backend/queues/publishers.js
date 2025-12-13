// backend/queues/publishers.js
const { queues } = require('./index');
const EVENTS = require('./events');
const PAYLOADS = require('./payloads');

async function publishArticleIngested(articleId) {
  return queues.ingestion.add(EVENTS.ARTICLE_INGESTED, { articleId });
}

async function publishSummaryRequested(articleId, options) {
  return queues.summarization.add(
    EVENTS.SUMMARY_REQUESTED,
    {
      articleId,
      options: {
        mode: options.mode || 'brief',
        language: options.language || 'en',
        humorLevel: options.humorLevel ?? 3,
      }
    }
  );
}

async function publishAudioRequested(summaryId, options) {
  return queues.tts.add(EVENTS.AUDIO_REQUESTED, PAYLOADS.AudioRequested(summaryId, options));
}

async function publishDigestRequested(userId, options) {
  return queues.digest.add(EVENTS.DIGEST_REQUESTED, PAYLOADS.DigestRequested(userId, options));
}

module.exports = {
  publishArticleIngested,
  publishSummaryRequested,
  publishAudioRequested,
  publishDigestRequested,
};
