const express = require('express');
const router = express.Router();

const { summaryRepo } = require('../db');
const { publishSummaryRequested } = require('../queues/publishers');
const SUMMARY_MODES = require('../constants/summaryModes');

// GET /article/:id/explain
router.get('/:id/explain', async (req, res) => {
  const articleId = req.params.id;
  const language = req.query.language || 'en';

  // 1️⃣ Check if detailed summary already exists
  const existing = summaryRepo
    .listByArticle(articleId)
    .find(s => s.mode === SUMMARY_MODES.DETAILED && s.language === language);

  if (existing) {
    return res.json({
      status: 'ready',
      mode: 'detailed',
      summary: existing
    });
  }

  // 2️⃣ Trigger background generation
  await publishSummaryRequested(articleId, {
    mode: SUMMARY_MODES.DETAILED,
    language
  });

  // 3️⃣ Tell UI to wait
  return res.status(202).json({
    status: 'processing',
    message: 'Detailed explanation is being generated'
  });
});

module.exports = router;
