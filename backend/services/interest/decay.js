// backend/services/interest/decay.js

/**
 * Exponential decay
 * After ~7 days → interest halves
 */
const HALF_LIFE_HOURS = 48;

function decayScore(score, lastUpdatedAt) {
  const ageMs = Date.now() - new Date(lastUpdatedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  const decayFactor = Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
  return Number((score * decayFactor).toFixed(4));
}

module.exports = { decayScore };
