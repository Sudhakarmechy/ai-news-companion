// backend/feed/freshness.js
function computeFreshness(publishedAt) {
  const diff = Date.now() - new Date(publishedAt).getTime();

  if (diff < 60 * 60 * 1000) return 'just_now';
  if (diff < 24 * 60 * 60 * 1000) return 'today';
  return 'earlier';
}

module.exports = { computeFreshness };
