// backend/services/ingestion/googleNewsFetcher.js
const Parser = require('rss-parser');
const parser = new Parser();

/**
 * Build Google News RSS URL
 */
function buildGoogleNewsUrl({ country = 'IN', language = 'en' } = {}) {
  const hl = `${language}-${country}`;
  const gl = country;
  const ceid = `${country}:${language}`;
  return `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

/**
 * Fetch raw articles from Google News
 */
async function fetchGoogleNews({ country, language }) {
  const url = buildGoogleNewsUrl({ country, language });
  console.log('[ingestion] Fetching:', url);

  const feed = await parser.parseURL(url);

  return (feed.items || []).map(item => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    source: item.source?.title || 'Google News',
    description: item.contentSnippet || '',
  }));
}

module.exports = {
  fetchGoogleNews,
};
