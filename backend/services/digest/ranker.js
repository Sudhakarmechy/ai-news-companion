const { userEventRepo } = require('../../db');
const { buildUserProfile } = require('./personalization');

async function rankSummaries({ summaries, userId, type }) {
  let profile = null;

  if (userId) {
    const events = await userEventRepo.listByUser(userId);
    profile = buildUserProfile(events);
  }

  return summaries
    .map(s => ({
      ...s,
      score: baseScore(s, type) + categoryBoost(s, profile) + audioBoost(s, profile)
    }))
    .sort((a, b) => b.score - a.score);
}

// ✅ ADDED: Base scoring function (recency + popularity + type)
function baseScore(summary, type) {
  const now = Date.now();
  const createdAt = new Date(summary.createdAt).getTime();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);

  // Recency (fresher = higher score)
  const recencyScore = Math.max(0, 1 - (ageHours / 48)); // 48hr half-life

  // Popularity (views/reads boost)
  const popularityScore = (summary.views || 0) * 0.01 + (summary.reads || 0) * 0.05;

  // Type-specific boosts
  const typeBoosts = {
    trending: 1.5,
    daily: 1.0,
    weekly: 0.8
  };
  const typeScore = typeBoosts[type] || 1.0;

  // Language match (assuming English preference)
  const languageScore = summary.language === 'en' ? 0.1 : 0;

  return recencyScore + popularityScore + typeScore + languageScore;
}

function categoryBoost(summary, profile) {
  if (!profile || !summary.tags) return 0;

  return summary.tags.reduce((acc, tag) => {
    const boost = profile.categories?.[tag] || 0;
    return acc + boost;
  }, 0);
}

function audioBoost(summary, profile) {
  if (!profile || !summary.audio_url) return 0;
  return profile.audioAffinity || 0;
}

module.exports = {
  rankSummaries,
  baseScore,
  categoryBoost,
  audioBoost
};
