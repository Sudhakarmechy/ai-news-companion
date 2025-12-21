function filterByFreshness(summaries, hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;

  return summaries.filter(s => {
    if (!s.createdAt) return false;
    const t = new Date(s.createdAt).getTime();
    return !isNaN(t) && t >= cutoff;
  });
}


function filterSeenSummaries(summaries, userEvents) {
  const seenArticleIds = new Set(
    userEvents
      .filter(e =>
        ['summary_played', 'article_opened'].includes(e.type)
      )
      .map(e => e.articleId)
  );

  return summaries.filter(s => !seenArticleIds.has(s.articleId));
}

function diversifyByCategory(summaries, maxPerCategory = 2) {
  const bucket = {};
  const result = [];

  for (const s of summaries) {
    const cat = (s.tags && s.tags[0]) || 'general';
    bucket[cat] = bucket[cat] || 0;

    if (bucket[cat] < maxPerCategory) {
      bucket[cat]++;
      result.push(s);
    }
  }

  return result;
}





module.exports = {
  filterByFreshness,
  filterSeenSummaries,
  diversifyByCategory,
  
};

