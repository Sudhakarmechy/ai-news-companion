module.exports = {
  MIN_SCORE: 0.05,          // below this → delete
  MAX_SCORE: 5.0,           // cap runaway growth
  MAX_INTERESTS: 12,        // keep top N only
  STALE_DAYS: 30,           // drop if untouched
};