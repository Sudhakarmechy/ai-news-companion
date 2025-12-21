const { createUserProfile } = require('../models/UserProfile');

function buildUserProfile(userId, events) {
  const profile = createUserProfile(userId);

  for (const e of events) {
    const cat = e.metadata?.category;
    const lang = e.metadata?.language;
    const src = e.metadata?.source;

    if (cat) {
      profile.categoryAffinity[cat] =
        (profile.categoryAffinity[cat] || 0) + scoreForEvent(e.type);
    }

    if (lang) {
      profile.languageAffinity[lang] =
        (profile.languageAffinity[lang] || 0) + 1;
    }

    if (src) {
      profile.sourceAffinity[src] =
        (profile.sourceAffinity[src] || 0) + 1;
    }

    if (e.type === 'summary_played' || e.type === 'summary_completed') {
      profile.audioAffinity += 1;
    }
  }

  profile.updatedAt = new Date().toISOString();
  return profile;
}

function scoreForEvent(type) {
  switch (type) {
    case 'article_opened': return 1;
    case 'summary_played': return 2;
    case 'summary_completed': return 3;
    case 'article_skipped': return -1;
    default: return 0;
  }
}

module.exports = { buildUserProfile };
