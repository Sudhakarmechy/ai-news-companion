const { computeFreshness } = require('./freshness');
const { summaryRepo, articleRepo } = require('../../db');

async function getFeed({
  type = 'latest',
  limit = 20,
  cursor = null,
  language,
  category
}) {
  let summaries = summaryRepo.listAll({ language, category });

  // Attach article metadata
  summaries = summaries.map(s => {
    const article = articleRepo.getById(s.articleId) || {};
    return {
      ...s,
      publishedAt: article.publishedAt || s.createdAt,
      source: article.source || '',
      category: article.categories || [],
      freshness: computeFreshness(article.publishedAt || s.createdAt)
    };
  });

  // Sorting
  if (type === 'latest') {
    summaries.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
  }

  if (type === 'fresh') {
    summaries.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  if (type === 'trending') {
    summaries.sort((a, b) => {
      const scoreA = new Date(a.createdAt).getTime();
      const scoreB = new Date(b.createdAt).getTime();
      return scoreB - scoreA;
    });
  }

  // Cursor pagination
  if (cursor) {
    summaries = summaries.filter(
      s => new Date(s.createdAt) < new Date(cursor)
    );
  }

  const page = summaries.slice(0, limit + 1);
  const hasMore = page.length > limit;

  return {
    items: hasMore ? page.slice(0, limit) : page,
    nextCursor: hasMore
      ? page[limit - 1].createdAt
      : null,
    hasMore
  };
}

module.exports = { getFeed };
