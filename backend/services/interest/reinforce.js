// backend/services/interest/reinforce.js
function reinforceScore(score, action) {
  const boosts = {
    view: 0.02,
    open: 0.05,
    play: 0.08,
    complete: 0.12
  };

  const boost = boosts[action] || 0.01;
  return Math.min(1, Number((score + boost).toFixed(3)));
}

module.exports = { reinforceScore };
