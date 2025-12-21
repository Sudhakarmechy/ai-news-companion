// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { queue } = require('./queue');
const { Queue } = require('bullmq');
const axios = require('axios');
const VOICES_CACHE = path.join(__dirname, 'voices.json');
const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { buildUserProfile } = require('./feed/buildUserProfile');
const { scoreSummary } = require('./feed/scoreSummary');
const { userEventRepo } = require('./db');

// ✅ FIX 1: Import UserEvent correctly OR create simple UserEvent
// Option A: If ./models/UserEvent.js exists with proper exports
const { UserEvent } = require('./models/userEvent');
// Option B: Temporary simple implementation (uncomment if file missing)
// const UserEvent = { create: (data) => ({ ...data, id: Date.now(), createdAt: new Date().toISOString() }) };

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATA_DIR = __dirname;

const feedRoutes = require('./routes/feed');
app.use('/feed', feedRoutes);

const summaryRoutes = require('./routes/summaries');
app.use('/summaries', summaryRoutes);

const audioRoutes = require('./routes/audio');
app.use('/audio', audioRoutes);

const articleRoutes = require('./routes/article');
app.use('/article', articleRoutes);

app.use((req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'anon-default';
  next();
});

// monitorAuth function (unchanged)
function monitorAuth(req, res, next) {
  const secret = process.env.MONITOR_SECRET;
  if (!secret) return res.status(403).send('Monitor not configured');
  const token = req.headers['x-monitor-token'] || req.query.token;
  if (token && token === secret) return next();
  const ip = req.ip || req.connection.remoteAddress || '';
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) return next();
  return res.status(403).send('Forbidden');
}

function loadJSON(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Error parsing ${filename}`, e);
    return [];
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ✅ FIX 2: Remove duplicate /feed route (now handled by routes/feed.js)
app.get('/article/:id', (req, res) => {
  const id = req.params.id;
  const summaries = loadJSON('summaries.json');
  const raw = loadJSON('fetchedArticles.json');
  const s = summaries.find(x => x.id === id);
  const r = raw.find(x => x.id === id);

  if (!s && !r) return res.status(404).json({ error: 'Not found' });

  const result = {
    id,
    title: (s && (s.title || s.title_short)) || (r && r.title) || '',
    source: (r && r.source) || (s && s.tags && s.tags[0]) || '',
    publishedAt: (r && r.publishedAt) || null,
    full_text: (r && (r.content || r.description)) || null,
    summary: s ? (s.summary || s.summary_80_120) : null,
    hook: s ? s.hook : null,
    question: s ? s.question : null,
    tags: s ? s.tags : [],
    audio_url: (s && s.audio_url) || null,
    url: r ? r.url : null
  };

  res.json(result);
});

app.post('/play', async (req, res) => {
  const { article_id, voice_preset = null, humor_level = 3, force = false } = req.body || {};
  if (!article_id) return res.status(400).json({ error: 'article_id required' });

  const summariesPath = path.join(__dirname, 'summaries.json');
  let summaries = [];
  if (fs.existsSync(summariesPath)) {
    try { summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8')); } catch (e) { summaries = []; }
  }
  const idx = summaries.findIndex(x => x.id === article_id);
  const existing = idx !== -1 ? summaries[idx] : null;

  if (existing && existing.audio_url && !force) {
    const gen = existing.generated_with || {};
    const sameVoice = gen.voice_id && voice_preset ? gen.voice_id === voice_preset : !!gen.voice_id && !voice_preset;
    const sameHumor = (gen.humor_level || 0) === (humor_level || 0);

    if (sameVoice && sameHumor) {
      console.log(`[server] audio exists for ${article_id} and generated with same params => ready`);
      return res.json({ status: 'ready', audio_url: existing.audio_url });
    }
  }

  // ✅ FIX 3: Use userEventRepo.track instead of undefined track
  userEventRepo.track({
    userId: req.userId,
    articleId: article_id,
    action: 'listen',
    category: existing?.tags?.[0] || 'general',
    language: 'en'
  });

  try {
    console.log(`[server] queueing audio generation for ${article_id} voice=${voice_preset} humor=${humor_level} force=${force}`);
    const job = await queue.add(
      'generate-audio',
      { articleId: article_id, voicePreset: voice_preset, humorLevel: humor_level },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    );
    return res.status(202).json({ status: 'queued', jobId: job.id, message: 'Audio generation queued. Poll /article/:id' });
  } catch (err) {
    console.error('[server] failed to enqueue', err);
    return res.status(500).json({ error: 'Failed to queue TTS job', detail: err.message });
  }
});

app.post('/admin/reload', (req, res) => {
  res.json({ status: 'reloaded', time: new Date().toISOString() });
});

// ✅ FIX 4: Fixed /events endpoint
app.post('/events', (req, res) => {
  const { userId, type, articleId, summaryId, metadata } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'userId and type required' });
  }

  // Create event data
  const event = {
    id: Date.now().toString(),
    userId,
    type,
    articleId,
    summaryId,
    metadata: metadata || {},
    createdAt: new Date().toISOString()
  };

  // ✅ Use UserEvent.create if available, otherwise direct repo call
  try {
    if (typeof UserEvent?.create === 'function') {
      const createdEvent = UserEvent.create(event);
      if (userEventRepo.logEvent) userEventRepo.logEvent(createdEvent);
    } else {
      // Fallback: direct repo call
      if (userEventRepo.logEvent) {
        userEventRepo.logEvent(event);
      } else if (userEventRepo.track) {
        userEventRepo.track(event);
      }
    }
  } catch (err) {
    console.error('Event logging failed:', err);
    // Don't fail the request - just log
  }

  res.json({ status: 'ok' });
});

// Bull-board setup (unchanged)
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
});

app.use('/admin/queues', monitorAuth, serverAdapter.getRouter());

app.listen(PORT, () => {
  console.log(`API server started on http://localhost:${PORT}`);
});

// /voices endpoint (moved to end, unchanged)
app.get('/voices', async (req, res) => {
  // ... (your existing voices logic - unchanged)
});
