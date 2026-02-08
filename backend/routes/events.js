const express = require('express');
const router = express.Router();

const { createUserEvent } = require('../models/userEvent');
const { userEventRepo, summaryRepo, articleRepo } = require('../db');
const { updateInterestGraph } = require('../services/interest/interestService');

router.post('/', async (req, res) => {
  const {
    userId,
    type,        // e.g. 'view', 'play'
    summaryId,
    articleId,
    metadata = {}
  } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'userId and type are required' });
  }

  // 1️⃣ Save raw event
  const userEvent = createUserEvent({
    userId,
    type,
    summaryId,
    articleId,
    metadata
  });

  userEventRepo.save(userEvent);

  // 2️⃣ Resolve article + category
  const summary = summaryId ? summaryRepo.getById(summaryId) : null;
  const article = articleId ? articleRepo.getById(articleId) : null;

  // 3️⃣ NORMALIZED interest event ✅
  await updateInterestGraph({
    userId,
    action: type,                                 // 👈 REQUIRED
    category:
      metadata.category ||
      article?.categories?.[0] ||
      summary?.category ||
      'general'
  });

  res.json({ status: 'ok' });
});

module.exports = router;
