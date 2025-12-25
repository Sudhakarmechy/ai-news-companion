const WEIGHTS = require('../../constants/interestWeights');
const { interestGraphRepo } = require('../../db');
const { createInterestGraph } = require('../../models/InterestGraph');

// function extractTags({ summary, article }) {
//   return [
//     ...(summary?.tags || []),
//     ...(article?.categories || []),
//     article?.country,
//     article?.language
//   ].filter(Boolean);
// }

function extractTags({ summary, article }) {
  const tags = new Set();

  // 1. Explicit categories (future-proof)
  if (article?.categories?.length) {
    article.categories.forEach(c => tags.add(c.toLowerCase()));
  }

  // 2. Country & language (VERY IMPORTANT)
  if (article?.country) tags.add(article.country.toLowerCase());
  if (article?.language) tags.add(article.language.toLowerCase());

  // 3. Source
  if (article?.sourceDomain) tags.add(article.sourceDomain);

  // 4. Keyword extraction (cheap but effective)
  const text = `${article?.title || ''} ${article?.description || ''}`.toLowerCase();

  const KEYWORDS = [
    'ai', 'technology', 'politics', 'election', 'government',
    'sports', 'cricket', 'football', 'economy', 'market',
    'startup', 'business', 'health', 'science'
  ];

  KEYWORDS.forEach(k => {
    if (text.includes(k)) tags.add(k);
  });

  return Array.from(tags);
}


async function updateInterestGraph({ userId, event, summary, article }) {
  const weight = WEIGHTS[event.type] || 0;
  if (weight === 0) return;

  const graph =
    interestGraphRepo.getByUser(userId) ||
    createInterestGraph({ userId });

  const tags = extractTags({ summary, article });

  tags.forEach(tag => {
    graph.interests[tag] = (graph.interests[tag] || 0) + weight;
    if (graph.interests[tag] < 0) graph.interests[tag] = 0;
  });

  graph.updatedAt = new Date().toISOString();
  interestGraphRepo.save(graph);
}

module.exports = { updateInterestGraph };
