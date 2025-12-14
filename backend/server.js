// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { queue  } = require('./queue');
const { Queue } = require('bullmq');
const axios = require('axios');
const VOICES_CACHE = path.join(__dirname, 'voices.json');
const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter'); // BullMQ support

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DATA_DIR = __dirname; // summaries.json and fetchedArticles.json live here

const feedRoutes = require('./routes/feed');
app.use('/feed', feedRoutes);

 const summaryRoutes = require('./routes/summaries');
app.use('/summaries', summaryRoutes);

const audioRoutes = require('./routes/audio');
app.use('/audio', audioRoutes);


// simple token-based middleware to protect the monitor UI
function monitorAuth(req, res, next) {
  const secret = process.env.MONITOR_SECRET;
  if (!secret) return res.status(403).send('Monitor not configured');
  const token = req.headers['x-monitor-token'] || req.query.token;
  if (token && token === secret) return next();
  // optional: allow from localhost without token
  const ip = req.ip || req.connection.remoteAddress || '';
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')) return next();
  return res.status(403).send('Forbidden');
}


function loadJSON(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    // Ensure it's an array for safety; fallback to [] if not
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Error parsing ${filename}`, e);
    return [];
  }
}

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET /feed?limit=10
// returns array of summarized articles (from summaries.json), merged with metadata
app.get('/feed', (req, res) => {
  const limit = parseInt(req.query.limit || '10', 10);
  const summaries = loadJSON('summaries.json');
  const raw = loadJSON('fetchedArticles.json');

  // merge by id (summaries have id)
  const mapRaw = {};
  raw.forEach(r => { mapRaw[r.id] = r; });

  const merged = summaries.map(s => {
    const meta = mapRaw[s.id] || {};
    return {
      id: s.id,
      title: s.title || meta.title || s.title_short || '',
      source: meta.source || 'unknown',
      publishedAt: meta.publishedAt || null,
      summary: s.summary || s.summary_80_120 || '',
      hook: s.hook || '',
      question: s.question || '',
      tags: s.tags || [],
      audio_url: s.audio_url || null, // placeholder for later TTS
      url: meta.url || null
    };
  });

 

  // simple sorting by publishedAt if present (newest first)
  merged.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  res.json(merged.slice(0, limit));
});

// GET /article/:id
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

  // if audio exists and matches requested generation parameters, return ready
  if (existing && existing.audio_url && !force) {
    const gen = existing.generated_with || {};
    const sameVoice = gen.voice_id && voice_preset ? gen.voice_id === voice_preset : !!gen.voice_id && !voice_preset;
    const sameHumor = (gen.humor_level || 0) === (humor_level || 0);

    if (sameVoice && sameHumor) {
      console.log(`[server] audio exists for ${article_id} and generated with same params => ready`);
      return res.json({ status: 'ready', audio_url: existing.audio_url });
    }
  }

  // otherwise enqueue regeneration
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

// Simple admin endpoint to reload data in-memory (dev convenience)
app.post('/admin/reload', (req, res) => {
  res.json({ status: 'reloaded', time: new Date().toISOString() });
});

// setup bull-board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [ new BullMQAdapter(queue) ],
  serverAdapter,
});

// mount with auth
app.use('/admin/queues', monitorAuth, serverAdapter.getRouter());

app.listen(PORT, () => {
  console.log(`API server started on http://localhost:${PORT}`);
});

app.get('/voices', async (req, res) => {
  try {
    // 1) If we have a valid cached file and it's fresh (<1 hour), return it.
    if (fs.existsSync(VOICES_CACHE)) {
      try {
        const raw = fs.readFileSync(VOICES_CACHE, 'utf8');
        if (raw && raw.trim().length > 0) {
          const stat = fs.statSync(VOICES_CACHE);
          const ageMs = Date.now() - stat.mtimeMs;
          if (ageMs < 1000 * 60 * 60) { // 1 hour freshness
            const cached = JSON.parse(raw);
            return res.json({ source: 'cache', voices: cached });
          }
        } else {
          console.log('[voices] Cache file exists but empty — will refresh from API.');
        }
      } catch (err) {
        console.warn('[voices] Failed to read/parse cache:', err.message);
        // fall through to fetch from API
      }
    }

   const apiKey = process.env.ELEVEN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    console.log('[voices] Fetching voices from ElevenLabs API...');
    const resp = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
      timeout: 15000
    });

     if (!resp || !resp.data) {
      console.warn('[voices] ElevenLabs responded with empty body or non-JSON');
      // If we have any cache, return stale cache
      if (fs.existsSync(VOICES_CACHE)) {
        try {
          const raw = fs.readFileSync(VOICES_CACHE, 'utf8');
          const cached = raw ? JSON.parse(raw) : [];
          return res.json({ source: 'stale-cache', voices: cached });
        } catch (e) {
          return res.status(500).json({ error: 'Empty response from ElevenLabs and cache unreadable' });
        }
      }
      return res.status(502).json({ error: 'Empty response from ElevenLabs' });
    }

     // Normalize array - ElevenLabs may return { voices: [...] } or an array directly
    let voicesRaw = [];
    if (Array.isArray(resp.data)) voicesRaw = resp.data;
    else if (Array.isArray(resp.data.voices)) voicesRaw = resp.data.voices;
    else {
      // attempt to coerce object with keys
      voicesRaw = Object.values(resp.data).flat().filter(Boolean);
    }

    // Map to { id, name, preview? }
    const voices = (voicesRaw || []).map(v => ({
      id: v.voice_id || v.id || v.voiceId || v.voice_id || '',
      name: v.name || v.label || v.voice_name || (v.id ? String(v.id) : 'unknown'),
      preview: v.preview_url || v.sample_url || null
    })).filter(v => v.id && v.name);

    // Cache the normalized list to disk (best-effort)
    try {
      fs.writeFileSync(VOICES_CACHE, JSON.stringify(voices, null, 2));
    } catch (err) {
      console.warn('[voices] Failed to write cache file:', err.message);
    }

    return res.json({ source: 'api', voices });
  } catch (err) {
    console.error('[voices] Error fetching voices:', err.response?.status, err.response?.data || err.message);
    // If cache exists, return stale cache
    if (fs.existsSync(VOICES_CACHE)) {
      try {
        const raw = fs.readFileSync(VOICES_CACHE, 'utf8');
        const cached = raw ? JSON.parse(raw) : [];
        return res.json({ source: 'stale-cache', voices: cached });
      } catch (e) {
        // fallthrough
      }
    }
    return res.status(500).json({ error: 'Failed to fetch voices', detail: err.message });
  }
});



