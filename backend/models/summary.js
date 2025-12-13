// backend/models/summary.js

/**
 * @typedef {Object} Summary
 * @property {string} id
 * @property {string} articleId
 * @property {'brief'|'detailed'|'humor'|'simple'} mode
 * @property {string} text           - The main summary
 * @property {string|null} hook      - Catchy hook/intro line
 * @property {string|null} question  - Follow-up question for engagement
 * @property {string} language       - ISO lang code
 * @property {number|null} approxDurationSeconds - Rough estimate for audio length
 * @property {string[]} tags         - Semantic tags/keywords
 * @property {string|null} provider  - e.g. 'gemini-1.5-flash'
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function createSummary(data) {
  const now = new Date().toISOString();

  return {
    id: String(data.id),
    articleId: String(data.articleId),
    mode: data.mode || 'brief',
    text: data.text || '',
    hook: data.hook || null,
    question: data.question || null,
    language: (data.language || 'en').toLowerCase(),
    approxDurationSeconds: data.approxDurationSeconds ?? null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    provider: data.provider || null,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : now,
  };
}

function fromRaw(raw) {
  return createSummary({
    id: raw.id,
    articleId: raw.articleId,
    mode: raw.mode,
    text: raw.text || raw.summary,
    hook: raw.hook,
    question: raw.question,
    language: raw.language,
    approxDurationSeconds: raw.approxDurationSeconds,
    tags: raw.tags,
    provider: raw.provider,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

module.exports = {
  createSummary,
  fromRaw,
};
