const express = require('express');
const router = express.Router();
const { userEventRepo } = require('../db');

router.post('/', async (req, res) => {
  const {
    userId,
    type,
    summaryId,
    articleId,
    metadata = {}
  } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'userId and type required' });
  }

  userEventRepo.save({
    userId,
    type,
    summaryId,
    articleId,
    metadata,
    createdAt: new Date().toISOString()
  });

  res.json({ status: 'ok' });
});

module.exports = router;
