// backend/routes/article.js
const express = require('express');
const router = express.Router();

const { articleRepo, summaryRepo } = require('../db');
const interactionRepo = require('../db/interactionRepo');

// GET /article/:id
router.get('/:id', (req, res) => {
  const articleId = req.params.id;

  // 1. Load article
  const article = articleRepo.getArticleById(articleId);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  // 2. Load summaries for this article
  const summaries = summaryRepo.listByArticle(articleId);

  // Prefer "brief" summary for now
  const summary =
    summaries.find(s => s.mode === 'brief') ||
    summaries[0] ||
    null;

  // 3. Build stable response
  const response = {
    id: article.id,
    title: article.title,
    description: article.description,
    url: article.url,

    source: article.source,
    sourceDomain: article.sourceDomain,

    country: article.country,
    region: article.region,
    language: article.language,
    categories: article.categories,

    publishedAt: article.publishedAt,
    createdAt: article.createdAt,

    summary: summary
      ? {
          id: summary.id,
          text: summary.text,
          hook: summary.hook,
          question: summary.question,
          audio_url: summary.audio_url || null,
          mode: summary.mode,
          language: summary.language,
        }
      : null,
  };

 

  res.json(response);
});

module.exports = router;