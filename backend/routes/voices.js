const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const VOICES_CACHE = path.join(__dirname, '../voices.json');
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

/**
 * GET /voices
 * Returns list of available TTS voices
 */
router.get('/', async (req, res) => {
  try {
    if (!ELEVEN_API_KEY) {
      return res.status(500).json({
        error: 'ELEVEN_API_KEY not configured'
      });
    }

    // ✅ Serve cache if fresh (< 1 hour)
    if (fs.existsSync(VOICES_CACHE)) {
      try {
        const stat = fs.statSync(VOICES_CACHE);
        const ageMs = Date.now() - stat.mtimeMs;

        if (ageMs < 60 * 60 * 1000) {
          const cached = JSON.parse(fs.readFileSync(VOICES_CACHE, 'utf8'));
          return res.json({
            source: 'cache',
            voices: cached
          });
        }
      } catch {
        // ignore cache errors
      }
    }

    // 🔁 Fetch from ElevenLabs
    const resp = await axios.get(
      'https://api.elevenlabs.io/v1/voices',
      {
        headers: {
          'xi-api-key': ELEVEN_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    if (!resp.data || !Array.isArray(resp.data.voices)) {
      return res.status(502).json({
        error: 'Invalid response from ElevenLabs'
      });
    }

    const voices = resp.data.voices.map(v => ({
      id: v.voice_id,
      name: v.name,
      preview: v.preview_url || null
    }));

    // 💾 Cache to disk
    try {
      fs.writeFileSync(VOICES_CACHE, JSON.stringify(voices, null, 2));
    } catch (e) {
      console.warn('[voices] cache write failed:', e.message);
    }

    return res.json({
      source: 'api',
      voices
    });

  } catch (err) {
    console.error('[voices]', err.message);

    // 🧯 Fallback to cache
    if (fs.existsSync(VOICES_CACHE)) {
      try {
        const cached = JSON.parse(fs.readFileSync(VOICES_CACHE, 'utf8'));
        return res.json({
          source: 'stale-cache',
          voices: cached
        });
      } catch {}
    }

    return res.status(500).json({
      error: 'Failed to fetch voices'
    });
  }
});

module.exports = router;
