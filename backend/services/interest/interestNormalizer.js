// backend/services/interest/interestNormalizer.js

const MAX_SCORE = 1.0;
const MIN_SCORE = 0.0;

function clampScore(score) {
  if (Number.isNaN(score)) return 0;
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, score));
}

function normalizeScores(interests) {
  const entries = Object.entries(interests);
  if (entries.length === 0) return interests;

  const max = Math.max(...entries.map(([_, v]) => v.score));

  // If everything is zero, do nothing
  if (max <= 0) return interests;

  const normalized = {};

  for (const [key, data] of entries) {
    normalized[key] = {
      ...data,
      score: clampScore(data.score / max)
    };
  }

  return normalized;
}

module.exports = {
  clampScore,
  normalizeScores
};
