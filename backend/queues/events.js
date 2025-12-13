// backend/queues/events.js

/**
 * Canonical events used across the system.
 * DO NOT rename lightly — these are contracts.
 */
module.exports = {
  ARTICLE_INGESTED: 'article.ingested',
  SUMMARY_REQUESTED: 'summary.requested',
  SUMMARY_CREATED: 'summary.created',
  AUDIO_REQUESTED: 'audio.requested',
  AUDIO_CREATED: 'audio.created',
  DIGEST_REQUESTED: 'digest.requested',
};
