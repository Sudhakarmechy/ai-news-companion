// backend/db/summaryRepo.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../summaries_store.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAll(summaries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(summaries, null, 2));
}

// Insert or replace
function upsertSummary(summary) {
  const summaries = readAll();

  const index = summaries.findIndex(s => s.id === summary.id);

  if (index !== -1) {
    summaries[index] = summary;
  } else {
    summaries.push(summary);
  }

  writeAll(summaries);
}

function listByArticle(articleId) {
  return readAll().filter(s => s.articleId === articleId);
}

module.exports = {
  upsertSummary,
  listByArticle,
  getAll: readAll
};
