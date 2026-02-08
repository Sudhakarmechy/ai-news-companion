const DAY_MS = 24 * 60 * 60 * 1000;

// Tunable knobs (SAFE defaults)
const DECAY_RATE_PER_DAY = 0.05;   // 5% per day
const MIN_SCORE = 0.02;            // prune below this
const MAX_AGE_DAYS = 30;           // hard cutoff

function decayAndPrune(interests) {
  const now = Date.now();
  const result = {};

  for (const [key, meta] of Object.entries(interests || {})) {
    const last = new Date(meta.updatedAt).getTime();
    const ageDays = (now - last) / DAY_MS;

    // 1️⃣ Decay score
    const decayedScore = meta.score * Math.exp(-DECAY_RATE_PER_DAY * ageDays);

    // 2️⃣ Prune conditions
    if (decayedScore < MIN_SCORE) continue;
    if (ageDays > MAX_AGE_DAYS) continue;

    result[key] = {
      score: Number(decayedScore.toFixed(4)),
      updatedAt: meta.updatedAt
    };
  }

  return result;
}

module.exports = { decayAndPrune };
