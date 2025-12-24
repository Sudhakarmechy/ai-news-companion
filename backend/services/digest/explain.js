function explainSummary({ summary, profile, rules, type }) {
  const reasons = [];

  // 1️⃣ Category preference
  if (profile && summary.tags) {
    for (const tag of summary.tags) {
      if ((profile.categories?.[tag] || 0) >= 3) {
        reasons.push(`You often read ${tag} news`);
        break;
      }
    }
  }

  // 2️⃣ Freshness
  const ageHours =
    (Date.now() - new Date(summary.createdAt).getTime()) / 3600000;

  if (ageHours < 6) {
    reasons.push('Published recently');
  }

  // 3️⃣ Audio preference
  if (profile?.audioAffinity > 2 && summary.audio_url) {
    reasons.push('You prefer audio summaries');
  }

  // 4️⃣ Digest type fallback
  if (reasons.length === 0) {
    reasons.push(defaultReason(type));
  }

  return reasons.slice(0, 2); // keep it short
}

function defaultReason(type) {
  switch (type) {
    case 'daily': return 'Top stories today';
    case 'trending': return 'Trending right now';
    case 'evening': return 'Evening catch-up';
    case 'category': return 'Matches your selected topic';
    default: return 'Recommended for you';
  }
}

module.exports = { explainSummary };
