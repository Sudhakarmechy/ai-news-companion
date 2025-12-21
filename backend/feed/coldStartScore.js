// backend/feed/coldStartScore.js

const TRUSTED_SOURCES = [
  'bbc.com',
  'reuters.com',
  'thehindu.com',
  'timesofindia.com',
  'indianexpress.com'
];

function coldStartScore(item, preferredLanguage = 'en') {
  let score = 0;

  // Freshness
  const hoursAgo = (Date.now() - new Date(item.publishedAt)) / 36e5;
  if (hoursAgo < 6) score += 8;
  else if (hoursAgo < 12) score += 6;
  else if (hoursAgo < 24) score += 3;

  // Language match
  if (item.language === preferredLanguage) score += 4;

  // Trusted source
  if (TRUSTED_SOURCES.includes(item.sourceDomain)) score += 5;

  // Category boost
  if (['politics', 'india', 'business', 'technology'].includes(item.category)) {
    score += 3;
  }

  return score;
}

module.exports = { coldStartScore };
