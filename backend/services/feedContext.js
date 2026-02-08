function resolveFeedContext(interestGraph) {
  const isColdUser =
    !interestGraph ||
    Object.keys(interestGraph.interests || {}).length === 0;

  return { isColdUser };
}

module.exports = { resolveFeedContext };
