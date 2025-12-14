const express = require('express');
const router = express.Router();
const { summaryRepo } = require('../db');
const { queues } = require('../queues');
const EVENTS = require('../queues/events');

/**
 * POST /audio/request
 * Body: { summaryId, voiceId, humorLevel, force }
 */
router.post('/request', async (req, res) => {
  try {
    const { summaryId, voiceId = null, humorLevel = 3, force = false } = req.body;

    if (!summaryId) {
      return res.status(400).json({ ok: false, error: "summaryId required" });
    }

    const summary = summaryRepo.getById(summaryId);
    if (!summary) {
      return res.status(404).json({ ok: false, error: "Summary not found" });
    }

    // if audio already exists and params match
    if (summary.audio_url && !force) {
      const meta = summary.generated_with || {};
      const sameVoice = meta.voiceId === voiceId;
      const sameHumor = meta.humorLevel === humorLevel;

      if (sameVoice && sameHumor) {
        return res.json({ ok: true, status: "ready", audio_url: summary.audio_url });
      }
    }

    // otherwise queue new job
    const job = await queues.tts.add(
      EVENTS.AUDIO_REQUESTED,
      {
        summaryId,
        voiceId,
        humorLevel
      },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true
      }
    );

    return res.json({ ok: true, status: "queued", jobId: job.id });
  } catch (err) {
    console.error("POST /audio/request error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});


/**
 * GET /audio/by-summary/:id
 */
router.get('/by-summary/:id', (req, res) => {
  const summaryId = req.params.id;

  const summary = summaryRepo.getById(summaryId);
  if (!summary) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }

  return res.json({
    ok: true,
    summaryId,
    audio_url: summary.audio_url || null,
    generated_with: summary.generated_with || null
  });
});

/**
 * GET /audio/latest
 */
router.get('/latest', (req, res) => {
  const limit = Number(req.query.limit || 20);
  const all = summaryRepo.getAll();

  const withAudio = all.filter(s => s.audio_url);

  withAudio.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    ok: true,
    items: withAudio.slice(0, limit)
  });
});

module.exports = router;
