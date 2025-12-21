const Digest = require('../../models/Digest');
const { summaryRepo, articleRepo, userEventRepo, digestRepo } = require('../../db');
const { getCandidateSummaries } = require('./candidates');
const { rankSummaries } = require('./ranker');
const {
  filterByFreshness,
  filterSeenSummaries,
  diversifyByCategory
} = require('./filters');
const RULES = require('./rules'); // ✅ Now exists

async function generateDigest({
  type,
  userId = null,
  category = null,
  language = 'en',
  limit = 7
}) {
  // 1. Fetch candidate summaries
  const summaries = await getCandidateSummaries({ type, userId, category, language });

  // 2. Rank summaries
  const ranked = await rankSummaries({
    summaries,
    userId,
    type
  });

  // 3. Apply filters
  let filtered = ranked;
  const rules = RULES.DIGEST_RULES[type] || RULES.DIGEST_RULES.daily;

  // Freshness
  filtered = await filterByFreshness(filtered, rules.freshnessHours);

  // Repeat avoidance
  if (userId && rules.avoidRepeats) {
    const events = await userEventRepo.listByUser(userId);
    filtered = await filterSeenSummaries(filtered, events);
  }

  // Diversity
  if (rules.diversify) {
    filtered = await diversifyByCategory(filtered);
  }

  // 4. Slice final selection ✅ AFTER filtering
  const selected = filtered.slice(0, limit);

  // 5. Build digest
  const digest = Digest.create({
    userId,
    type,
    category,
    language,
    summaryIds: selected.map(s => s.id),
    articleIds: selected.map(s => s.articleId),
    metadata: {
      generatedFrom: summaries.length,
    }
  });

  // 6. Persist
  await digestRepo.saveDigest(digest);

  return digest;
}

module.exports = { generateDigest };
