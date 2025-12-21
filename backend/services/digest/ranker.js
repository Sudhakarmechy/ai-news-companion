const { userEventRepo } = require('../../db');

function rankSummaries({ summaries, userId, type }) {
  if (!userId) {
    // Public digests → newest first
    return summaries.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  const events = userEventRepo.listByUser(userId);

  return summaries
    .map(s => {
      let score = 0;

      // Recency boost
      score += Date.now() - new Date(s.createdAt).getTime() < 6 * 3600 * 1000 ? 3 : 1;

      // User interaction boost
      events.forEach(e => {
        if (e.articleId === s.articleId) {
          if (e.type === 'summary_played') score += 3;
          if (e.type === 'article_opened') score += 2;
          if (e.type === 'article_skipped') score -= 2;
        }
      });

      return { ...s, _score: score };
    })
    .sort((a, b) => b._score - a._score);
}

module.exports = { rankSummaries };
