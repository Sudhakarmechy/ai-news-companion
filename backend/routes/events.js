const express = require('express');
const router = express.Router();

const { createUserEvent } = require('../models/userEvent');
const { userEventRepo } = require('../db');

const { updateInterestGraph } = require('../services/interest/interestBuilder');
const { summaryRepo, articleRepo } = require('../db');

router.post('/', async (req, res) => {
  const {
    userId,
    type,
    summaryId,
    articleId,
    metadata
  } = req.body;

  if (!userId || !type) {
    return res.status(400).json({
      error: 'userId and type are required'
    });
  }

  const event = createUserEvent({
    userId,
    type,
    summaryId,
    articleId,
    metadata
  });

  userEventRepo.save(event);

  const summary = summaryId ? summaryRepo.getById(summaryId) : null;
const article = articleId ? articleRepo.getArticleById(articleId) : null;

await updateInterestGraph({
  userId,
  event,
  summary,
  article
});

  res.json({ status: 'ok' });
});

module.exports = router;
