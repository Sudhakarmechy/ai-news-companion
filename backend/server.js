// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { queue } = require('./queue');  // ✅ Fallback to original queue
let queues = null;  // ✅ Safe queues initialization
let EVENTS = null;  // ✅ Safe EVENTS initialization

try {
  // ✅ Safe import with fallback
  const queueModule = require('./queue');
  if (queueModule.queues) queues = queueModule.queues;
  const eventsModule = require('./queues/events');
  if (eventsModule.default) EVENTS = eventsModule.default;
  else if (eventsModule.EVENTS) EVENTS = eventsModule.EVENTS;
} catch (importErr) {
  console.warn('[server] queues/events import failed, using fallback:', importErr.message);
}

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
const { UserEvent } = require('./models/userEvent');

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

const digestRoutes = require('./routes/digest');
app.use('/digest', digestRoutes);

const voiceRoutes = require('./routes/voices');
app.use('/voices', voiceRoutes);

const articleExplainRouter = require('./routes/articleExplain');
app.use('/article', articleExplainRouter);

app.use('/events', require('./routes/events'));

app.use((req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'anon-default';
  next();
});

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

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

  // Load summaries safely
  const summariesPath = path.join(__dirname, 'summaries.json');
  let summaries = [];
  if (fs.existsSync(summariesPath)) {
    try { summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8')); } catch (e) { summaries = []; }
  }
  const existing = summaries.find(x => x.id === article_id);

  // Check existing audio (with voice/humor matching)
  if (existing && existing.audio_url && !force) {
    const gen = existing.generated_with || {};
    const sameVoice = gen.voice_id && voice_preset ? gen.voice_id === voice_preset : !!gen.voice_id && !voice_preset;
    const sameHumor = (gen.humor_level || 0) === humor_level;
    if (sameVoice && sameHumor) {
      return res.json({ status: 'ready', audio_url: existing.audio_url });
    }
  }

  // Track event safely
  try {
    if (userEventRepo?.track) {
      userEventRepo.track({
        userId: req.userId,
        articleId: article_id,
        action: 'listen',
        category: existing?.tags?.[0] || 'general',
        language: 'en'
      });
    }
  } catch (trackErr) {
    console.warn('[server] event tracking failed:', trackErr.message);
  }

  try {
    console.log(`[server] queueing TTS for ${article_id} voice=${voice_preset}`);

    if (queues?.tts) {
      // ✅ Match worker: exact job name + worker-expected fields
      await queues.tts.add('audio-requested', { 
        summaryId: article_id,  // worker expects summaryId
        voiceId: voice_preset,   // worker expects voiceId
        humorLevel: humor_level
      });
      console.log('[server] TTS job queued successfully');
    } else {
      // Fallback queue (ensure worker also listens to fallback)
      await queue.add('audio-requested', { 
        summaryId: article_id,
        voiceId: voice_preset,
        humorLevel: humor_level
      });
    }

    res.status(202).json({ 
      status: 'queued', 
      message: 'Audio generation queued. Poll /article/:id',
      queueType: queues?.tts ? 'tts' : 'fallback'
    });
  } catch (err) {
    console.error('[server] queueing failed:', err);
    res.status(500).json({ error: 'Failed to queue TTS job', detail: err.message });
  }
});


app.post('/admin/reload', (req, res) => {
  res.json({ status: 'reloaded', time: new Date().toISOString() });
});

app.post('/events', (req, res) => {
  const { userId, type, articleId, summaryId, metadata } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: 'userId and type required' });
  }

  const event = {
    id: Date.now().toString(),
    userId,
    type,
    articleId,
    summaryId,
    metadata: metadata || {},
    createdAt: new Date().toISOString()
  };

  try {
    if (typeof UserEvent?.create === 'function') {
      const createdEvent = UserEvent.create(event);
      if (userEventRepo?.logEvent) {
        userEventRepo.logEvent(createdEvent);
      } else if (userEventRepo?.track) {
        userEventRepo.track(createdEvent);
      }
    } else if (userEventRepo?.logEvent) {
      userEventRepo.logEvent(event);
    } else if (userEventRepo?.track) {
      userEventRepo.track(event);
    }
  } catch (err) {
    console.error('Event logging failed:', err);
  }

  res.json({ status: 'ok' });
});

// Bull-board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
});

app.use('/admin/queues', monitorAuth, serverAdapter.getRouter());

app.listen(PORT, () => {
  console.log(`API server started on http://localhost:${PORT}`);
  console.log('Queue status:', { hasTTSQueue: !!queues?.tts, hasEvents: !!EVENTS });
});

// /voices endpoint
app.get('/voices', async (req, res) => {
  // ... existing voices logic
});
