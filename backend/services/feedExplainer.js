function explainItem({
  item,
  interestGraph,
  isColdUser
}) {
  const why = [];

  // 1️⃣ Freshness
  if (item.freshness === 'just_now') {
    why.push('Just published');
  } else if (item.freshness === 'today') {
    why.push('Happening today');
  }

  // 2️⃣ Cold user fallback
  if (isColdUser) {
    if (item._score >= 4) {
      why.push('Trending right now');
    }
    return why;
  }

  // 3️⃣ Interest-based reasons
  const interests = interestGraph?.interests || {};
  const topCategory = item.category?.[0];

  if (topCategory && interests[topCategory]) {
    why.push(`Because you read ${topCategory} news`);
  }

  // 4️⃣ Region / country relevance
  if (item.region && item.region === interestGraph?.region) {
    why.push('Popular in your region');
  }

  // 5️⃣ Fallback
  if (why.length === 0) {
    why.push('Recommended for you');
  }

  return why;
}

module.exports = { explainItem };
