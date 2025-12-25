function scoreByPopularity(summary, allSummaries) {
  const views = summary.views || 0;
  const plays = summary.plays || 0;

  return views * 1 + plays * 2;
}

module.exports = { scoreByPopularity };