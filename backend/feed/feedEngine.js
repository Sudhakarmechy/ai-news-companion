// backend/feed/feedEngine.js
const { computeFreshness } = require('./freshness');
const { summaryRepo, articleRepo, interestGraphRepo } = require('../db');
const { rankFeed } = require('../services/feedRanker');
const { rankColdFeed } = require('./coldRanker');
const { explainSummary } = require('./explainer');
const { computeInterestConfidence } = require('../services/interest/interestConfidence');
const { blendRankings } = require('./blendRankings');
const { explainFeedMeta } = require('./feedMeta');

const MAX_LIMIT = 50;

async function getFeed({
  type = 'latest',
  limit = 20,
  cursor = null,
  language = 'en',
  category,
  userId = null
}) {

  
  limit = Math.min(Number(limit) || 20, MAX_LIMIT);

  // 1️⃣ Fetch summaries
  let summaries = summaryRepo.listAll({ language, category });
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  // 2️⃣ Load interest graph + compute confidence
  let interestGraph = null;
  let isColdUser = true;
  let confidence = 0; // ✅ FIXED: Default value

  if (userId) {
    interestGraph = await interestGraphRepo.getByUser(userId); // ✅ FIXED: Await missing
    isColdUser = 
      !interestGraph ||
      !interestGraph.interests ||
      Object.keys(interestGraph.interests).length === 0;
    
    // ✅ FIXED: Compute confidence BEFORE ranking
    confidence = computeInterestConfidence({ 
      interestGraph, 
      summaries,
      isColdUser 
    });
  }
console.log('[feed] interestGraph:', interestGraph);
  // 3️⃣ Enrich summaries (STRICT CONTRACT)
  const enriched = summaries.filter(s => !isBlocked(s.category, interestGraph)).map(s => {
    const article = articleRepo.getById(s.articleId) || {};

    const categories = Array.isArray(article.categories) && article.categories.length
      ? article.categories
      : ['general'];

    return {
      ...s,
      publishedAt: article.publishedAt || s.createdAt,
      source: article.source || article.sourceDomain || 'unknown',
      categories,
      freshness: computeFreshness(article.publishedAt || s.createdAt)
    };
  });

function isBlocked(category, interestGraph) {
  const data = interestGraph?.interests?.[category];
  if (!data?.blockedUntil) return false;
  return Date.now() < data.blockedUntil;
}

  // 4️⃣ Rank (confidence now defined)
  // backend/feed/feedEngine.js - ONLY FIXED rankedList scope issue

  // 4️⃣ Rank (confidence now defined)
  const coldRanked = await rankColdFeed({ summaries: enriched, type });
  const personalRanked = interestGraph
    ? await rankFeed({ summaries: enriched, interestGraph })
    : [];

  let ranked;
  if (confidence === 0) {
    ranked = coldRanked;
  } else if (confidence === 1) {
    ranked = personalRanked;
  } else {
    // ✅ FIXED: Ensure both are arrays before blending
    const coldItems = Array.isArray(coldRanked) ? coldRanked : coldRanked?.summaries || [];
    const personalItems = Array.isArray(personalRanked) ? personalRanked : personalRanked?.summaries || [];
    ranked = blendRankings(coldItems, personalItems, confidence);
  }

  // ✅ FIXED: Define rankedList IMMEDIATELY after ranked
  const rankedList = ranked?.summaries || ranked;
  
  console.log('[feed] confidence:', confidence);
  if (!Array.isArray(rankedList) || rankedList.length === 0) {
    return { items: [], nextCursor: null, hasMore: false };
  }


  // 5️⃣ Cursor pagination (AFTER ranking)
  let filtered = rankedList;
  if (cursor) {
    const cursorTime = new Date(cursor).getTime();
    filtered = filtered.filter(
      item => new Date(item.createdAt).getTime() < cursorTime
    );
  }

  const page = filtered.slice(0, limit + 1);
  const hasMore = page.length > limit;
  const items = hasMore ? page.slice(0, limit) : page;

  // 6️⃣ Explain WHY (ARRAY, ALWAYS)
  const explainedItems = items.map(item => ({
    ...item,
    why: explainSummary({
      summary: item,
      interestGraph,
      isColdUser
    })
  }));

const feedMessage = explainFeedMeta({ confidence, isColdUser });

  return {
  items: explainedItems,
  nextCursor: hasMore ? page[limit].createdAt : null, // ✅ FIXED: Missing cursor value
  hasMore,
  source: confidence === 0 ? 'cold' : confidence === 1 ? 'personal' : 'blended',
  confidence,
  message: feedMessage
};
}

module.exports = { getFeed };
