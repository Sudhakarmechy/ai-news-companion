// backend/services/ingestion/categoryClassifier.js
const CATEGORIES = require('../../config/categories');

/**
 * Classify article into categories using keywords
 */
function classifyCategories(text = '') {
  const lower = text.toLowerCase();
  const matched = new Set();

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        matched.add(category);
        break;
      }
    }
  }

  // Fallback category
  if (matched.size === 0) {
    matched.add('general');
  }

  return Array.from(matched);
}

module.exports = {
  classifyCategories,
};
