const express = require('express');
const router = express.Router();

const { coldStartScore } = require('../feed/coldStartScore');
const { articleRepo, summaryRepo } = require('../db');
const { track } = require('../db/interactionRepo.js');
const { userEventRepo, userProfileRepo } = require('../db');
const { buildUserProfile } = require('../services/preferenceBuilder');
const { rankFeed } = require('../services/feedRanker');

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
  const { cursor, order = 'latest', country, region, language, category, source } = req.query;

  const articles = articleRepo.getAll();
  const summaries = summaryRepo.getAll();

  // ✅ Create lookup maps
  const articleMap = {};
  articles.forEach(a => { articleMap[a.id] = a; });

  const summaryMap = {};
  summaries.forEach(s => { summaryMap[s.articleId] = s; });

  // ✅ COLD START RANKING LOGIC (NEW)
  const enrichedItems = summaries
    .map(s => {
      const a = articleMap[s.articleId];
      if (!a) return null; // Skip if no article

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
        summary: s.text,
        hook: s.hook,
        question: s.question,
        audio_url: s.audio_url || null,
        // ✅ Cold start scoring
        score: coldStartScore({ ...a, ...s }, a.language || s.language)
      };
    })
    .filter(Boolean); // Remove nulls

  // ✅ Apply filters to ranked items
  let feed = enrichedItems;
  if (country) feed = feed.filter(f => f.country === country);
  if (region) feed = feed.filter(f => f.region === region);
  if (language) feed = feed.filter(f => f.language === language);
  if (category) feed = feed.filter(f => f.categories?.includes(category));
  if (source) feed = feed.filter(f => f.source === source);

  // ✅ Sort by cold start SCORE first, then recency
  feed.sort((a, b) => {
    // Primary: highest score first
    if (b.score !== a.score) return b.score - a.score;
    
    // Secondary: most recent
    const da = new Date(a.publishedAt || 0).getTime();
    const db = new Date(b.publishedAt || 0).getTime();
    return order === 'oldest' ? da - db : db - da;
  });

  // Cursor pagination (by score + time)
  if (cursor) {
    const cursorTime = new Date(cursor).getTime();
    feed = feed.filter(item => {
      const t = new Date(item.publishedAt || 0).getTime();
      return order === 'oldest' ? t > cursorTime : t < cursorTime;
    });
  }

  const items = feed.slice(0, limit);
  const last = items[items.length - 1];

  // Track impressions
  items.forEach(item => {
    track({
      userId: req.userId || 'anon',
      articleId: item.id,
      action: 'view',
      category: item.categories?.[0] || 'general',
      language: item.language || 'en'
    });
  });


  res.json({
    items: items.map(({ score, ...item }) => item), // Remove score from response
    nextCursor: last?.publishedAt || null,
    hasMore: feed.length > limit
  });
});

router.get('/feed', (req, res) => {
  const userId = req.query.userId || 'anonymous';

  const articles = loadFeedArticles(); // your existing logic

  const events = userEventRepo.listByUser(userId);
  let profile = userProfileRepo.getProfile(userId);

  if (!profile && events.length > 0) {
    profile = buildUserProfile(userId, events);
    userProfileRepo.saveProfile(profile);
  }

  const ranked = rankFeed(articles, profile);
  res.json(ranked);
});


module.exports = router;
