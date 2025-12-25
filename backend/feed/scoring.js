function scoreByInterest(summary, interestGraph) {
  if (!interestGraph) return 0;

  let score = 0;
  const interests = interestGraph.interests || {};

  const tags = [
    ...(summary.tags || []),
    summary.language,
    summary.country
  ].filter(Boolean);

  tags.forEach(t => {
    if (interests[t]) score += interests[t];
  });

  return score;
}

function scoreByRecency(summary) {
  const ageMs = Date.now() - new Date(summary.createdAt).getTime();
  const hours = ageMs / (1000 * 60 * 60);

  if (hours < 1) return 10;
  if (hours < 6) return 7;
  if (hours < 24) return 4;
  if (hours < 48) return 2;
  return 1;
}

module.exports = {
  scoreByInterest,
  scoreByRecency
};
