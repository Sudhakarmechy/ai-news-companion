const { scoreByRecency } = require('./scoring');
const { scoreByPopularity } = require('./trending');

function rankColdFeed({ summaries }) {
  return summaries
    .map(s => {
      const recency = scoreByRecency(s);
      const popularity = scoreByPopularity(s, summaries);

      return {
        ...s,
        _score: recency * 0.7 + popularity * 0.3
      };
    })
    .sort((a, b) => b._score - a._score);
}

module.exports = { rankColdFeed };
