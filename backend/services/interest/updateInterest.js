// backend/services/interest/updateInterest.js
const { decayScore } = require('./decay');
const { reinforceScore } = require('./reinforce');

const baseBoost = {
  view: 0.05,
  play: 0.12,
  share: 0.2,
  like: 0.3,
  // ❌ Negative signals
  skip: -0.05,
  dismiss: -0.2,
  not_interested: -0.6,
  downvote: -1.0
};

function updateInterest({ interest, eventType }) {
  const boost = baseBoost[eventType] || 0.03;
  
  const decayed = decayScore(
    interest.score || 0,
    interest.updatedAt
  );

  const reinforced = reinforceScore(decayed, boost); // Fixed: use boost, not eventType

  return {
    score: reinforced,
    updatedAt: new Date().toISOString()
  };
}

module.exports = { updateInterest };
