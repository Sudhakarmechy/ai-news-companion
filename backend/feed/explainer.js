function explainSummary({
  summary,
  interestGraph,
  isColdUser
}) {
  const reasons = [];

  // 1️⃣ Interest-based
  if (interestGraph?.interests) {
    const tags = summary.category || [];
    tags.forEach(tag => {
      if (interestGraph.interests[tag]) {
        reasons.push(`Because you follow ${tag}`);
      }
    });
  }

  // 2️⃣ Freshness
  if (summary.freshness === 'just_now') {
    reasons.push('Breaking news');
  } else if (summary.freshness === 'today') {
    reasons.push('Happening today');
  }

  // 3️⃣ Location
  if (summary.country) {
    reasons.push(`Popular in ${summary.country}`);
  }

  // 4️⃣ Cold start fallback
  if (isColdUser) {
    reasons.push('Trending right now');
  }

  // Safety limit
  return reasons.slice(0, 2);
}

module.exports = { explainSummary };
