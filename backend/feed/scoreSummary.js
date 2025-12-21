// backend/feed/scoreSummary.js

function scoreSummary(summary, profile) {
  let score = 0;

  // Language match
  if (profile.preferredLanguage && summary.language === profile.preferredLanguage) {
    score += 3;
  }

  // Category match
  if (profile.topCategories?.includes(summary.category)) {
    score += 5;
  }

  // Source affinity
  if (profile.topSources?.includes(summary.sourceDomain)) {
    score += 4;
  }

  // Freshness boost (last 24h)
  const hoursAgo = (Date.now() - new Date(summary.publishedAt)) / 36e5;
  if (hoursAgo < 24) score += 2;

  return score;
}

module.exports = { scoreSummary };
