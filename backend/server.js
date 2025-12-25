// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATA_DIR = __dirname;

// ✅ Safe queue imports
let queues = null;
let EVENTS = null;
try {
  const queueModule = require('./queue');
  if (queueModule.queues) queues = queueModule.queues;
  const eventsModule = require('./queues/events');
  if (eventsModule.default) EVENTS = eventsModule.default;
  else if (eventsModule.EVENTS) EVENTS = eventsModule.EVENTS;
} catch (importErr) {
  console.warn('[server] queues/events import failed:', importErr.message);
}

const { Queue } = require('bullmq');
const axios = require('axios');
const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { userEventRepo } = require('./db');

// ✅ Route imports
const feedRoutes = require('./routes/feed');
const summaryRoutes = require('./routes/summaries');
const audioRoutes = require('./routes/audio');
const articleRoutes = require('./routes/article');
const digestRoutes = require('./routes/digest');
const voiceRoutes = require('./routes/voices');
const eventsRoutes = require('./routes/events');
const articleExplainRoutes = require('./routes/articleExplain');

// ✅ Mount routes
app.use('/feed', feedRoutes);
app.use('/summaries', summaryRoutes);
app.use('/audio', audioRoutes);
app.use('/article', articleRoutes);
app.use('/article', articleExplainRoutes);
app.use('/digest', digestRoutes);
app.use('/voices', voiceRoutes);
app.use('/events', eventsRoutes);

// ✅ User ID middleware
app.use((req, res, next) => {
  req.userId = req.headers['x-user-id'] || 'anon';
  next();
});

// ✅ Monitor auth middleware
function monitorAuth(req, res, next) {
  const secret = process.env.MONITOR_SECRET;
  if (!secret) return res.status(403).send('Monitor not configured');
  const token = req.headers['x-monitor-token'] || req.query.token;
  if (token && token === secret) return next();
  const ip = req.ip || req.connection.remoteAddress || '';
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) return next();
  return res.status(403).send('Forbidden');
}

// ✅ Utility functions
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

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ✅ FIXED /article/:id endpoint
app.get('/article/:id', (req, res) => {
  const { id } = req.params;
  const summaries = loadJSON('summaries.json');
  const articles = loadJSON('fetchedArticles.json');
  
  const summary = summaries.find(s => s.id === id || s.articleId === id);
  const article = articles.find(a => a.id === id);
  
  if (!summary && !article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  res.json({
    id,
    title: summary?.title || article?.title || '',
    source: article?.source || summary?.tags?.[0] || '',
    publishedAt: article?.publishedAt || summary?.createdAt || null,
    full_text: article?.content || article?.description || null,
    summary: summary?.summary || summary?.summary_80_120 || null,
    hook: summary?.hook || null,
    question: summary?.question || null,
    tags: summary?.tags || article?.categories || [],
    audio_url: summary?.audio_url || null,
    url: article?.url || null
  });
});

// ✅ /play endpoint (TTS queueing)
app.post('/play', async (req, res) => {
  const { article_id, voice_preset = null, humor_level = 3, force = false } = req.body || {};
  if (!article_id) return res.status(400).json({ error: 'article_id required' });

  // Check existing audio
  const summariesPath = path.join(__dirname, 'summaries.json');
  let summaries = [];
  if (fs.existsSync(summariesPath)) {
    try { 
      summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8')); 
    } catch (e) { 
      summaries = []; 
    }
  }
  const existing = summaries.find(x => x.id === article_id);

  if (existing?.audio_url && !force) {
    const gen = existing.generated_with || {};
    const sameVoice = (!voice_preset && gen.voice_id) || (voice_preset === gen.voice_id);
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

  // Queue TTS job
  try {
    console.log(`[server] queueing TTS for ${article_id} voice=${voice_preset}`);
    
    if (queues?.tts) {
      await queues.tts.add('audio-requested', { 
        summaryId: article_id,
        voiceId: voice_preset,
        humorLevel: humor_level
      });
    } else {
      const { queue } = require('./queue');
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

// ✅ /voices endpoint
app.get('/voices', async (req, res) => {
  try {
    const voicesPath = path.join(__dirname, 'voices.json');
    if (fs.existsSync(voicesPath)) {
      const voices = JSON.parse(fs.readFileSync(voicesPath, 'utf8'));
      res.json(voices);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('[voices] load failed:', err);
    res.status(500).json({ error: 'Failed to load voices' });
  }
});

// ✅ Admin endpoints
app.post('/admin/reload', (req, res) => {
  res.json({ status: 'reloaded', time: new Date().toISOString() });
});

// ✅ Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const queueList = [];
if (queues?.tts) queueList.push(new BullMQAdapter(queues.tts));
const { queue } = require('./queue');
queueList.push(new BullMQAdapter(queue));

createBullBoard({ queues: queueList, serverAdapter });
app.use('/admin/queues', monitorAuth, serverAdapter.getRouter());

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 API server started on http://localhost:${PORT}`);
  console.log('📊 Queue status:', { 
    hasTTSQueue: !!queues?.tts, 
    hasEvents: !!EVENTS,
    totalQueues: queueList.length 
  });
});
