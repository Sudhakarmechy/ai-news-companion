function explainSummary({ summary, interestGraph, isColdUser }) {
  const reasons = [];

  // 1️⃣ Interest-based explanation
  if (!isColdUser && interestGraph?.interests) {
    const interests = Object.entries(interestGraph.interests)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([k]) => k.toLowerCase());

    const matched = summary.categories?.find(c =>
      interests.includes(c.toLowerCase())
    );

    if (matched) {
      reasons.push(`You often read ${matched} news`);
    }
  }

  // 2️⃣ Category fallback
  if (reasons.length === 0 && summary.category) {
    reasons.push(`Popular in ${summary.category}`);
  }

  // 3️⃣ Freshness explanation
  if (summary.freshness === 'just_now') {
    reasons.push('Just published');
  } else if (summary.freshness === 'today') {
    reasons.push('Trending today');
  }

  // 4️⃣ Cold start fallback
  if (reasons.length === 0) {
    reasons.push('Recommended for you');
  }

  return reasons.slice(0, 3);
}

module.exports = { explainSummary };
