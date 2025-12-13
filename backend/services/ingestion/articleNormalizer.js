// backend/services/ingestion/articleNormalizer.js
const crypto = require('crypto');
const { Article } = require('../../models');

/**
 * Create stable article ID using URL hash
 */
function generateArticleId(url) {
  return crypto.createHash('sha1').update(url).digest('hex');
}

function normalizeArticle(raw, { country, language }) {
  return Article.create({
    id: generateArticleId(raw.link),
    title: raw.title,
    url: raw.link,
    source: raw.source,
    country,
    language,
    categories: [], // will be enriched later
    description: raw.description,
    publishedAt: raw.pubDate,
  });
}

module.exports = {
  normalizeArticle,
};
