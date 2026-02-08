const RULES = require('./pruneRules');

function pruneInterests(interests = {}) {
  const now = Date.now();

  let entries = Object.entries(interests)
    .map(([key, data]) => {
      const ageDays =
        (now - new Date(data.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

      return {
        key,
        score: Math.min(data.score, RULES.MAX_SCORE),
        updatedAt: data.updatedAt,
        ageDays
      };
    })

    // ❌ drop stale
    .filter(i => i.ageDays <= RULES.STALE_DAYS)

    // ❌ drop weak
    .filter(i => i.score >= RULES.MIN_SCORE);

  // 🔢 sort strongest first
  entries.sort((a, b) => b.score - a.score);

  // ✂️ keep top N
  entries = entries.slice(0, RULES.MAX_INTERESTS);

  // 🔁 rebuild object
  return Object.fromEntries(
    entries.map(i => [
      i.key,
      { score: Number(i.score.toFixed(4)), updatedAt: i.updatedAt }
    ])
  );
}

module.exports = { pruneInterests };
