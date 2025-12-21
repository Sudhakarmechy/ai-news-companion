// backend/feed/buildUserProfile.js

function buildUserProfile(events = []) {
  const categoryCount = {};
  const sourceCount = {};
  const languageCount = {};

  for (const e of events) {
    // Language
    if (e.language) {
      languageCount[e.language] = (languageCount[e.language] || 0) + 1;
    }

    // Category
    if (e.category) {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    }

    // Source
    if (e.sourceDomain) {
      sourceCount[e.sourceDomain] = (sourceCount[e.sourceDomain] || 0) + 1;
    }
  }

  return {
    preferredLanguage: topKey(languageCount),
    topCategories: topKeys(categoryCount, 3),
    topSources: topKeys(sourceCount, 3)
  };
}

/* helpers */

function topKey(map) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function topKeys(map, limit = 3) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

module.exports = { buildUserProfile };
