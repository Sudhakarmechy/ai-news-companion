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

// ✅ NEW: getById - finds single summary by ID
function getById(id) {
  return readAll().find(s => s.id === id);
}

// ✅ NEW: listAll - returns all summaries with optional filters
function listAll(filters = {}) {
  const summaries = readAll();
  
  return summaries.filter(summary => {
    // Filter by articleId
    if (filters.articleId && summary.articleId !== filters.articleId) return false;
    
    // Filter by language
    if (filters.language && summary.language !== filters.language) return false;
    
    // Filter by category (if summary has categories field)
    if (filters.category && (!summary.categories || !summary.categories.includes(filters.category))) return false;
    
    // Filter by date range
    if (filters.fromDate || filters.toDate) {
      const summaryDate = new Date(summary.createdAt || summary.updatedAt || 0);
      if (filters.fromDate && summaryDate < new Date(filters.fromDate)) return false;
      if (filters.toDate && summaryDate > new Date(filters.toDate)) return false;
    }
    
    return true;
  });
}

module.exports = {
  upsertSummary,
  listByArticle,
  getById,        // ✅ ADDED: Fixes "summaryRepo.getById is not a function"
  getAll: readAll,
  listAll         // ✅ Added listAll
};
