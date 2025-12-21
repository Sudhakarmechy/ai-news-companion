const { summaryRepo } = require('../../db');

function getCandidateSummaries({ type, userId, category, language }) {
  let summaries = summaryRepo.listAll();

  // Filter by language
  summaries = summaries.filter(s => s.language === language);

  // Category-specific digest
  if (type === 'category' && category) {
    summaries = summaries.filter(s =>
      (s.tags || []).includes(category)
    );
  }

  // Trending digest ignores user
  if (type === 'trending') {
    return summaries;
  }

  // Daily / evening digest
  return summaries;
}

module.exports = { getCandidateSummaries };
