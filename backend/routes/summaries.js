const express = require('express');
const router = express.Router();

const { summaryRepo, articleRepo } = require('../db');

/**
 * GET /summaries/latest
 * Returns last 30 summaries, newest first.
 */
router.get('/latest', (req, res) => {
  try {
    const limit = Number(req.query.limit || 30);

    const summaries = summaryRepo
      .getAll()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    res.json({ ok: true, summaries });
  } catch (err) {
    console.error("Error fetching latest summaries:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


/**
 * GET /summaries/by-article/:id
 * Example: /summaries/by-article/12345?mode=brief
 */
router.get('/by-article/:id', (req, res) => {
  try {
    const articleId = req.params.id;
    const mode = req.query.mode;
    const language = req.query.language;

    const article = articleRepo.getArticleById(articleId);
    if (!article) {
      return res.status(404).json({ ok: false, error: 'Article not found' });
    }

    let summaries = summaryRepo.listByArticle(articleId);

    if (mode) summaries = summaries.filter(s => s.mode === mode);
    if (language) summaries = summaries.filter(s => s.language === language);

    res.json({
      ok: true,
      article,
      summaries
    });

  } catch (err) {
    console.error("Error fetching summaries by article:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


/**
 * GET /summaries/search?query=india&category=politics&country=IN
 * Future-proof for personalization
 */
router.get('/search', (req, res) => {
  try {
    const { query, category, country, language } = req.query;

    let summaries = summaryRepo.getAll();

    if (query) {
      summaries = summaries.filter(s =>
        s.text.toLowerCase().includes(query.toLowerCase()) ||
        s.hook.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (country) {
      summaries = summaries.filter(s => {
        const article = articleRepo.getArticleById(s.articleId);
        return article && article.country === country.toUpperCase();
      });
    }

    if (category) {
      summaries = summaries.filter(s => {
        const article = articleRepo.getArticleById(s.articleId);
        return article && article.categories.includes(category);
      });
    }

    if (language) {
      summaries = summaries.filter(s => s.language === language);
    }

    res.json({ ok: true, summaries });

  } catch (err) {
    console.error("Error searching summaries:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
