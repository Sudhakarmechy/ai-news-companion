// backend/routes/feed.js
const express = require('express');
const router = express.Router();

const { coldStartScore } = require('../feed/coldStartScore');
const { articleRepo, summaryRepo } = require('../db');
const { track } = require('../db/interactionRepo.js');
const { userEventRepo, userProfileRepo } = require('../db');
const { buildUserProfile } = require('../services/preferenceBuilder');
const { rankFeed } = require('../services/feedRanker');
const { getFeed } = require('../services/feed/feedEngine');

router.get('/', async (req, res) => {
  const {
    type = 'latest',
    limit = 20,
    cursor,
    language,
    category,
    country,
    region,
    source,
    order = 'latest',
    userId
  } = req.query;

  try {
    // 1️⃣ Try service-based feed first (recommended)
    let result;
    try {
      result = await getFeed({
        type,
        limit: Math.min(Number(limit), 50),
        cursor,
        language,
        category,
        userId: req.userId || userId
      });
      
      // If service returns data, use it
      if (result && result.items && result.items.length > 0) {
        trackImpressions(req.userId || 'anon', result.items);
        return res.json(result);
      }
    } catch (serviceErr) {
      console.warn('[feed] service failed, using fallback:', serviceErr.message);
    }

    // 2️⃣ FALLBACK: Cold start ranking (your existing logic)
    const articles = articleRepo.getAll();
    const summaries = summaryRepo.getAll();

    // Create lookup maps
    const articleMap = {};
    articles.forEach(a => { articleMap[a.id] = a; });

    const summaryMap = {};
    summaries.forEach(s => { summaryMap[s.articleId] = s; });

    // Enrich + cold start scoring
    const enrichedItems = summaries
      .map(s => {
        const a = articleMap[s.articleId];
        if (!a) return null;

        return {
          id: a.id,
          title: a.title,
          url: a.url,
          source: a.source,
          sourceDomain: a.sourceDomain,
          country: a.country,
          region: a.region,
          language: a.language || s.language,
          categories: a.categories,
          publishedAt: a.publishedAt,
          summary: s.summary || s.text || s.summary_80_120,
          hook: s.hook,
          question: s.question,
          audio_url: s.audio_url || null,
          score: coldStartScore({ ...a, ...s }, a.language || s.language)
        };
      })
      .filter(Boolean);

    // Apply filters
    let feed = enrichedItems;
    if (country) feed = feed.filter(f => f.country === country);
    if (region) feed = feed.filter(f => f.region === region);
    if (language) feed = feed.filter(f => f.language === language);
    if (category) feed = feed.filter(f => f.categories?.includes(category));
    if (source) feed = feed.filter(f => f.source === source);

    // Sort: score first, then recency
    feed.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const da = new Date(a.publishedAt || 0).getTime();
      const db = new Date(b.publishedAt || 0).getTime();
      return order === 'oldest' ? da - db : db - da;
    });

    // Cursor pagination
    if (cursor) {
      const cursorTime = new Date(cursor).getTime();
      feed = feed.filter(item => {
        const t = new Date(item.publishedAt || 0).getTime();
        return order === 'oldest' ? t > cursorTime : t < cursorTime;
      });
    }

    const limitNum = Math.min(Number(limit), 50);
    const items = feed.slice(0, limitNum);
    const last = items[items.length - 1];

    // Track impressions
    trackImpressions(req.userId || 'anon', items);

    res.json({
      items: items.map(({ score, ...item }) => item),
      nextCursor: last?.publishedAt || null,
      hasMore: feed.length > limitNum,
      source: 'fallback'
    });

  } catch (error) {
    console.error('[feed] Error:', error);
    res.status(500).json({ error: 'Feed generation failed', detail: error.message });
  }
});

// User-specific personalized feed
router.get('/feed', async (req, res) => {
  const userId = req.query.userId || req.userId || 'anonymous';

  try {
    const articles = articleRepo.getAll();
    const events = userEventRepo.listByUser(userId);
    let profile = userProfileRepo.getProfile(userId);

    if (!profile && events.length > 0) {
      profile = buildUserProfile(userId, events);
      userProfileRepo.saveProfile(profile);
    }

    const ranked = rankFeed(articles, profile);
    res.json(ranked);
  } catch (error) {
    console.error('[feed/personalized] Error:', error);
    res.status(500).json({ error: 'Personalized feed failed' });
  }
});

// Track impressions helper
function trackImpressions(userId, items) {
  if (!track || typeof track !== 'function') return;
  
  items.forEach(item => {
    try {
      track({
        userId,
        articleId: item.id,
        action: 'view',
        category: item.categories?.[0] || 'general',
        language: item.language || 'en'
      });
    } catch (e) {
      console.warn('[feed] impression tracking failed:', e.message);
    }
  });
}

module.exports = router;
