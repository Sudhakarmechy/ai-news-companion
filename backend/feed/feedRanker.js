const { scoreByInterest, scoreByRecency } = require('./scoring');

function rankFeed({ summaries, interestGraph }) {
  return summaries
    .map(s => {
      const interest = scoreByInterest(s, interestGraph);
      const recency = scoreByRecency(s);

      const finalScore =
        interest * 0.6 +
        recency * 0.3;

      return {
        ...s,
        _score: finalScore
      };
    })
    .sort((a, b) => b._score - a._score);
}

module.exports = { rankFeed };
