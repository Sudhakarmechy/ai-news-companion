// Time-based decay constants (production-safe)
const HALF_LIFE_DAYS = 14;   // interest halves every 14 days
const MIN_SCORE = 0.05;     // below this → pruned

function computeTimeDecayFactor(lastUpdatedAt) {
  const now = Date.now();
  const last = new Date(lastUpdatedAt).getTime();
  const ageDays = (now - last) / (1000 * 60 * 60 * 24);

  // Exponential decay: e^(-λt)
  const lambda = Math.log(2) / HALF_LIFE_DAYS;
  return Math.exp(-lambda * ageDays);
}

module.exports = {
  computeTimeDecayFactor,
  MIN_SCORE
};
