const { computeFreshness } = require('./freshness');
const { summaryRepo, articleRepo, interestGraphRepo } = require('../db');
const { rankFeed } = require('../services/feedRanker');
const { rankColdFeed } = require('../feed/coldRanker');
const { explainSummary } = require('./explainer');


async function getFeed({
  type = 'latest',
  limit = 20,
  cursor = null,
  language,
  category,
  userId = null
}) {
  let summaries = summaryRepo.listAll({ language, category });

  let interestGraph = null;
  if (userId) {
    interestGraph = interestGraphRepo.getByUser(userId);
  }

  const isColdUser =
    !interestGraph ||
    Object.keys(interestGraph.interests || {}).length === 0;

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

  let ranked;
  if (isColdUser) {
    ranked = rankColdFeed({ summaries, type });
  } else {
    ranked = rankFeed({ summaries, interestGraph });
  }

  // ✅ FIXED: Cursor pagination AFTER ranking
  if (cursor) {
    ranked = ranked.filter(
      s => new Date(s.createdAt) < new Date(cursor)
    );
  }

  // ✅ FIXED: Paginate ranked results
  const page = ranked.slice(0, limit + 1);
  const hasMore = page.length > limit;

  // ✅ FIXED: Use 'page' not 'items'
  const explainedItems = page.map(item => ({
    ...item,
    why: explainSummary({
      summary: item,
      interestGraph,
      isColdUser
    })
  }));

  return {
    items: hasMore ? explainedItems.slice(0, limit) : explainedItems,
    nextCursor: hasMore ? page[limit - 1]?.createdAt : null,
    hasMore
  };
}


module.exports = { getFeed };
