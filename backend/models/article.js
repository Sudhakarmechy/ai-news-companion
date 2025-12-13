// backend/models/article.js

/**
 * @typedef {Object} Article
 * @property {string} id                - Stable ID (hash/fingerprint or external ID)
 * @property {string} title
 * @property {string} url
 * @property {string} source            - Human readable source ("BBC", "TOI")
 * @property {string} sourceDomain      - Domain ("bbc.com", "timesofindia.com")
 * @property {string} country           - ISO country code (e.g. "IN", "US")
 * @property {string|null} region       - Region code (e.g. "IN.TN") or null
 * @property {string} language          - ISO language code ("en","ta","hi"...)
 * @property {string[]} categories      - e.g. ["technology","india"]
 * @property {string|null} rawHtml      - Original HTML if captured
 * @property {string|null} rawText      - Clean text if extracted
 * @property {string|null} thumbnailUrl
 * @property {string|null} description  - Short description from RSS/meta tags
 * @property {string|null} publishedAt  - ISO timestamp from source
 * @property {string} createdAt         - ISO timestamp
 * @property {string} updatedAt         - ISO timestamp
 */

/**
 * Create a new Article object with sane defaults.
 * This is DB-agnostic: you can later map it to Postgres, Mongo, etc.
 */
function createArticle(data) {
  const now = new Date().toISOString();

  return {
    id: String(data.id),
    title: data.title?.trim() || '',
    url: data.url || '',
    source: data.source || '',
    sourceDomain: data.sourceDomain || extractDomain(data.url) || '',
    country: (data.country || 'IN').toUpperCase(),
    region: data.region || null,
    language: (data.language || 'en').toLowerCase(),
    categories: Array.isArray(data.categories) ? data.categories : [],
    rawHtml: data.rawHtml || null,
    rawText: data.rawText || null,
    thumbnailUrl: data.thumbnailUrl || null,
    description: data.description || null,
    publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : now,
  };
}

/**
 * Convert "raw" ingested item (from RSS/parser) into Article
 */
function fromRaw(raw) {
  return createArticle({
    id: raw.id || raw.fingerprint || raw.link || raw.url,
    title: raw.title,
    url: raw.url || raw.link,
    source: raw.source,
    sourceDomain: raw.sourceDomain,
    country: raw.country,
    region: raw.region,
    language: raw.language,
    categories: raw.categories,
    rawHtml: raw.rawHtml,
    rawText: raw.rawText || raw.content,
    thumbnailUrl: raw.thumbnailUrl,
    description: raw.description,
    publishedAt: raw.publishedAt || raw.pubDate,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

function extractDomain(url = '') {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

module.exports = {
  createArticle,
  fromRaw,
};
