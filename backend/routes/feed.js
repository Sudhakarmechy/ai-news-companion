// backend/routes/feed.js
const express = require('express');
const router = express.Router();

const { articleRepo, summaryRepo } = require('../db');

// GET /feed?limit=20&country=IN&language=en&category=politics
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10);

  const country = req.query.country?.toUpperCase() || null;
  const region = req.query.region || null;
  const language = req.query.language || null;
  const category = req.query.category || null;

  // 1️⃣ Load repositories
  const articles = articleRepo.getAll();
  const summaries = summaryRepo.getAll();

  // 2️⃣ Index summaries by articleId (fast lookup)
  const summaryMap = {};
  summaries.forEach(s => summaryMap[s.articleId] = s);

  // 3️⃣ Build enriched objects
  let feed = articles
    .map(a => {
      const s = summaryMap[a.id];
      if (!s) return null;

      return {
        id: a.id,
        title: a.title,
        url: a.url,
        source: a.source,
        sourceDomain: a.sourceDomain,
        country: a.country,
        region: a.region,
        language: a.language,
        categories: a.categories,
        publishedAt: a.publishedAt,

        summary: s.text,
        hook: s.hook,
        question: s.question,
        audio_url: s.audio_url || null,
      };
    })
    .filter(Boolean);

  // 4️⃣ Optional filters
  if (country) feed = feed.filter(f => f.country === country);
  if (region) feed = feed.filter(f => f.region === region);
  if (language) feed = feed.filter(f => f.language === language);
  if (category) feed = feed.filter(f => f.categories?.includes(category));

  // 5️⃣ Sort newest first
  feed.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  // 6️⃣ Limit
  res.json(feed.slice(0, limit));
});

module.exports = router;
