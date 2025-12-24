function buildUserProfile(events = []) {
  const profile = {
    categories: {},
    recencyBias: 0,
    audioAffinity: 0
  };

  for (const e of events) {
    // CATEGORY PREFERENCE
    if (e.category) {
      profile.categories[e.category] =
        (profile.categories[e.category] || 0) + weightForEvent(e.type);
    }

    // AUDIO VS TEXT
    if (e.type === 'summary_played') profile.audioAffinity += 1;
    if (e.type === 'article_opened') profile.audioAffinity -= 0.5;

    // RECENCY
    const ageHours =
      (Date.now() - new Date(e.createdAt).getTime()) / 3600000;
    if (ageHours < 6) profile.recencyBias += 1;
  }

  return profile;
}

function weightForEvent(type) {
  switch (type) {
    case 'summary_played': return 3;
    case 'article_opened': return 2;
    case 'summary_skipped': return -2;
    default: return 0;
  }
}

module.exports = { buildUserProfile };
