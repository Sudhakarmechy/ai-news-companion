function pruneInterests(interests, minScore = 0.05) {
  const pruned = {};

  for (const [key, data] of Object.entries(interests || {})) {
    // ✅ NEVER prune brand-new interests
    if (data.score >= minScore || data.score === 0) {
      pruned[key] = data;
    }
  }

  return pruned;
}

module.exports = { pruneInterests };