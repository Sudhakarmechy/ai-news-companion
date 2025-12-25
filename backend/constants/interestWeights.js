const COLD_BOOST = 2;

module.exports = {
  summary_played: 1 * COLD_BOOST,
  summary_completed: 2 * COLD_BOOST,
  summary_skipped: -1,

  article_opened: 2 * COLD_BOOST,
  deep_dive_requested: 3 * COLD_BOOST,
};