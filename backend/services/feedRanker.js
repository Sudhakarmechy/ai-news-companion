function scoreArticle(article, profile) {
  let score = 0;

  for (const cat of article.categories || []) {
    score += profile.categoryAffinity[cat] || 0;
  }

  score += profile.languageAffinity[article.language] || 0;
  score += profile.sourceAffinity[article.source] || 0;

  return score;
}

function rankFeed(articles, profile) {
  if (!profile) return articles;

  return [...articles].sort((a, b) => {
    return scoreArticle(b, profile) - scoreArticle(a, profile);
  });
}

module.exports = { rankFeed };
