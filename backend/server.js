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
const DATA_DIR = __dirname; // summaries.json and fetchedArticles.json live here

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

// POST /play
// Request body: { article_id, voice_preset, humor_level }
// This is currently a stub that enqueues/generates audio later. For now it returns a placeholder response.
app.post('/play', (req, res) => {
  const { article_id, voice_preset = 'default', humor_level = 3 } = req.body || {};

  if (!article_id) return res.status(400).json({ error: 'article_id required' });

  // In production: check DB for existing audio_url, otherwise enqueue TTS job.
  // For now: return a pretend "processing" response; client should poll /article/:id for audio_url.
  res.json({
    status: 'processing',
    article_id,
    voice_preset,
    humor_level,
    message: 'TTS generation not implemented yet. This endpoint is a stub for flow testing.'
  });
});

// Simple admin endpoint to reload data in-memory (dev convenience)
app.post('/admin/reload', (req, res) => {
  res.json({ status: 'reloaded', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API server started on http://localhost:${PORT}`);
});