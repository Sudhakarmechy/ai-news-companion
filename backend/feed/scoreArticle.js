// backend/feed/scoreArticle.js

function scoreArticle(article, userProfile = {}, userHistory = {}) {
  let score = 1; // base score

  const now = Date.now();

  // 1. Recency boost (last 24 hours)
  if (article.publishedAt) {
    const ageHours =
      (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);

    if (ageHours <= 24) score += 2;
  }

  // 2. Language preference
  if (
    userProfile.preferredLanguage &&
    article.language === userProfile.preferredLanguage
  ) {
    score += 3;
  }

  // 3. Category preference
  if (
    Array.isArray(article.categories) &&
    Array.isArray(userProfile.topCategories)
  ) {
    const matches = article.categories.filter(c =>
      userProfile.topCategories.includes(c)
    );
    score += matches.length * 5;
  }

  // 4. Source preference
  if (
    userProfile.topSources &&
    article.sourceDomain &&
    userProfile.topSources.includes(article.sourceDomain)
  ) {
    score += 2;
  }

  // 5. Already read penalty
  if (userHistory.readArticles?.includes(article.id)) {
    score -= 10;
  }

  // 6. Skipped penalty
  if (userHistory.skippedArticles?.includes(article.id)) {
    score -= 5;
  }

  return score;
}

module.exports = { scoreArticle };
