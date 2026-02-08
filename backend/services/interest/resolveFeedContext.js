function resolveFeedContext(interestGraph) {
  const interests = interestGraph?.interests || {};
  const activeCount = Object.values(interests)
    .filter(i => i.score >= 0.15).length;

  const isColdUser = activeCount < 2;

  return {
    isColdUser,
    activeInterestCount: activeCount
  };
}

module.exports = { resolveFeedContext };
