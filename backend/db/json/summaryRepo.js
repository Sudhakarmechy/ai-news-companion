// backend/db/json/summaryRepo.js
const { createJsonRepo } = require('./baseJsonRepo');
const { Summary } = require('../../models');

// store summaries in backend/summaries_store.json (to not clash with your old file yet)
const repo = createJsonRepo('summaries_store.json', Summary.fromRaw);

function listByArticle(articleId) {
  return repo.list(s => s.articleId === String(articleId));
}

function getById(id) {
  return repo.getById(id);
}

function upsertSummary(summary) {
  return repo.upsert(summary);
}

module.exports = {
  listByArticle,
  getById,
  upsertSummary,
};
