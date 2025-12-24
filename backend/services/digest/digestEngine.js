const Digest = require('../../models/Digest');
const { summaryRepo, articleRepo, userEventRepo, digestRepo } = require('../../db');
const TTL_RULES = require('./cacheRules');
const { getCandidateSummaries } = require('./candidates');
const { rankSummaries } = require('./ranker');
const { buildUserProfile } = require('./personalization');
const { explainSummary } = require('./explain');
const {
  filterByFreshness,
  filterSeenSummaries,
  diversifyByCategory
} = require('./filters');
const RULES = require('./rules');

// ✅ CACHE USER EVENTS (fixes perf issue)
let userEventsCache = new Map();

async function generateDigest({
  type,
  userId = null,
  category = null,
  language = 'en',
  limit = 7,
  cursor = null,
}) {
  // 0. SINGLE userEventRepo call (cached)
  let profile = null;
  let userEvents = [];
  if (userId) {
    userEvents = await getUserEventsCached(userId);
    profile = buildUserProfile(userEvents);
  }

  // 1. Cache check FIRST
  const ttlMs = TTL_RULES[type] || (30 * 60 * 1000);
  const cached = digestRepo.findValidDigest({ type, userId, category, ttlMs });

  if (cached) {
    console.log('[digest] cache hit:', cached.id);
    const items = cached.summaryIds
      .map(id => summaryRepo.getById(id))
      .filter(Boolean);

    return {
      items: await Promise.all(items.map(item => enhanceWithExplanation(item, profile, type))),
      nextCursor: null,
      hasMore: false,
      cached: true
    };
  }

  // 2. Generate fresh digest
  const pipelineResult = await createDigestPipeline({
    type, userId, category, language, profile, limit, cursor, userEvents
  });

  // 3. Cache result
  await cacheDigest(pipelineResult.items, { userId, type, category, language });

  return pipelineResult;
}

// ✅ FIXED: Single cached user events call
async function getUserEventsCached(userId) {
  if (userEventsCache.has(userId)) {
    return userEventsCache.get(userId);
  }
  
  const events = await userEventRepo.listByUser(userId);
  userEventsCache.set(userId, events);
  return events;
}

// ✅ FIXED PIPELINE - passes userEvents
async function createDigestPipeline({ type, userId, category, language, profile, limit, cursor, userEvents }) {
  const summaries = await getCandidateSummaries({ type, userId, category, language });
  console.log(`[digest] Found ${summaries.length} candidates`); // ✅ DEBUG
  
  const rules = RULES.DIGEST_RULES[type] || RULES.DIGEST_RULES.daily;
  let filtered = await rankSummaries({ summaries, userId, type });

  // Filters (userEvents already cached)
  filtered = await filterByFreshness(filtered, rules.freshnessHours);
  
  if (userId && rules.avoidRepeats) {
    filtered = await filterSeenSummaries(filtered, userEvents);
  }
  
  if (rules.diversify) {
    filtered = await diversifyByCategory(filtered);
  }

  console.log(`[digest] After filters: ${filtered.length}`); // ✅ DEBUG

  // ✅ PAGINATION LOGIC (fixed)
  let page = filtered;
  if (cursor) {
    const cursorTime = new Date(cursor).getTime();
    page = page.filter(s => new Date(s.createdAt).getTime() < cursorTime);
    console.log(`[digest] Cursor filtered to ${page.length}`); // ✅ DEBUG
  }

  // ✅ CRITICAL: Ensure +1 for hasMore detection
  const fullPage = page.slice(0, limit + 1);
  const hasMore = fullPage.length > limit;
  const items = hasMore ? fullPage.slice(0, limit) : fullPage;
  
  const nextCursor = hasMore ? items[items.length - 1].createdAt : null;
  
  console.log(`[digest] Page: ${items.length}/${fullPage.length}, hasMore: ${hasMore}, nextCursor: ${nextCursor}`); // ✅ DEBUG

  // New user fallback
  if (userId && userEvents.length === 0 && items.length === 0) {
    const fallbackItems = summaries
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    
    return {
      items: await Promise.all(fallbackItems.map(item => enhanceWithExplanation(item, profile, type))),
      nextCursor: null,
      hasMore: false
    };
  }

  return {
    items: await Promise.all(items.map(item => enhanceWithExplanation(item, profile, type))),
    nextCursor,
    hasMore
  };
}

// ✅ FIXED HELPER
async function enhanceWithExplanation(summary, profile, type) {
  const rules = RULES.DIGEST_RULES[type] || RULES.DIGEST_RULES.daily;
  return {
    ...summary,
    explanation: await explainSummary({ summary, profile, rules, type })
  };
}

async function cacheDigest(items, context) {
  if (items.length === 0) return;

  const digest = Digest.create({
    userId: context.userId,
    type: context.type,
    category: context.category,
    language: context.language,
    summaryIds: items.map(s => s.id),
    articleIds: items.map(s => s.articleId),
    metadata: { generatedFrom: items.length, cached: false }
  });

  await digestRepo.saveDigest(digest);
}

module.exports = { generateDigest };
