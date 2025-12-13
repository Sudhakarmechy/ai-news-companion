// backend/queues/payloads.js

/**
 * Job payload contracts.
 * These must stay backward-compatible.
 */

module.exports = {
  ArticleIngested: (articleId) => ({
    articleId,
  }),

  SummaryRequested: (articleId, options = {}) => ({
    articleId,
    options: {
      mode: options.mode || 'brief',
      language: options.language || 'en',
      humorLevel: options.humorLevel ?? 3,
    },
  }),

  AudioRequested: (summaryId, options = {}) => ({
    summaryId,
    options: {
      voiceId: options.voiceId,
      persona: options.persona || 'neutral',
      language: options.language || 'en',
      speed: options.speed || 1.0,
    },
  }),

  DigestRequested: (userId, options = {}) => ({
    userId,
    options: {
      type: options.type || 'morning', // morning/evening/weekly
      durationMinutes: options.durationMinutes || 10,
      language: options.language || 'en',
    },
  }),
};
