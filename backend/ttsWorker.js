// backend/ttsWorker.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AWS = require('aws-sdk');

const ELEVEN_KEY = process.env.ELEVEN_API_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const DATA_DIR = __dirname;

if (!ELEVEN_KEY) console.warn('Warning: ELEVEN_API_KEY not set in .env');

AWS.config.update({ region: AWS_REGION });
const s3 = new AWS.S3();

function escapeXml(str = '') {
  return String(str || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSSML(summaryObj) {
  const title = summaryObj.title || summaryObj.title_short || '';
  const hook = summaryObj.hook || '';
  const summaryText = summaryObj.summary || summaryObj.summary_80_120 || '';
  const question = summaryObj.question || '';

  return `<speak>
    <p><s>Here's the headline: <break time="200ms"/> ${escapeXml(title)}</s></p>
    <p><s><prosody rate="medium">${escapeXml(summaryText)}</prosody></s></p>
    <p><s><break time="200ms"/> ${escapeXml(hook)}</s></p>
    <p><s><prosody rate="slow">${escapeXml(question)}</prosody></s></p>
  </speak>`;
}

/**
 * Generate audio from ElevenLabs voiceId.
 * voiceId should be the ElevenLabs voice id string like "2EiwWnXFnvU5JabPnv8n"
 * If your plan does not accept SSML, pass plainText instead.
 */
async function generateAudioEleven(voiceId, ssmlOrText, outPath) {
  if (!ELEVEN_KEY) throw new Error('ELEVEN_API_KEY missing');

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const body = { text: ssmlOrText }; // Many accounts accept plain text; SSML might be accepted too.

  const headers = {
    'xi-api-key': ELEVEN_KEY,
    'Content-Type': 'application/json',
    'Accept': 'audio/mpeg' // request audio back
  };

  try {
    const resp = await axios.post(url, body, {
      headers,
      responseType: 'arraybuffer',
      timeout: 120000
    });

    // Write audio output
    fs.writeFileSync(outPath, Buffer.from(resp.data));
    return outPath;
  } catch (err) {
    // surface helpful error
    const status = err.response?.status;
    const data = err.response?.data;
    let msg = `ElevenLabs TTS error${status ? ` (status ${status})` : ''}`;
    if (data) {
      // try to stringify response body
      try { msg += ': ' + JSON.stringify(data); } catch { msg += ': (binary)'; }
    } else {
      msg += ': ' + err.message;
    }
    const e = new Error(msg);
    e.original = err;
    throw e;
  }
}

async function uploadToS3(localPath, s3Key, contentType = 'audio/mpeg') {
  const body = fs.readFileSync(localPath);
  const params = { Bucket: S3_BUCKET, Key: s3Key, Body: body, ContentType: contentType, ACL: 'private' };
  return s3.putObject(params).promise();
}

function generateSignedUrl(s3Key, expires = 60 * 60 * 24) {
  const params = { Bucket: S3_BUCKET, Key: s3Key, Expires: expires };
  return s3.getSignedUrl('getObject', params);
}

/** Load cached voices if present (voices.json) */
function loadCachedVoices() {
  const vfile = path.join(DATA_DIR, 'voices.json');
  if (!fs.existsSync(vfile)) return null;
  try { return JSON.parse(fs.readFileSync(vfile, 'utf8')); } catch { return null; }
}

/**
 * runForArticle(articleId, voicePreset, humorLevel)
 * voicePreset can be:
 *  - an ElevenLabs voice id string (preferred)
 *  - a friendly name which we will try to map using cached voices.json
 */
async function runForArticle(articleId, voicePreset = null, humorLevel = 3) {
  try {
    const summariesPath = path.join(DATA_DIR, 'summaries.json');
    if (!fs.existsSync(summariesPath)) throw new Error('summaries.json missing');
    const summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
    const idx = summaries.findIndex(s => s.id === articleId);
    if (idx === -1) throw new Error(`Article ${articleId} not found in summaries.json`);

    const summaryObj = summaries[idx];

    // resolve voicePreset -> voiceId
    let voiceId = voicePreset || process.env.DEFAULT_ELEVEN_VOICE_ID || null;

    // if voiceId seems like a friendly name (contains non-base64), try map
    if (voiceId && !/^[A-Za-z0-9_-]{8,}/.test(voiceId)) {
      // try to map friendly name to id
      const cached = loadCachedVoices();
      if (cached && Array.isArray(cached)) {
        const v = cached.find(x => (x.name || '').toLowerCase() === voiceId.toLowerCase());
        if (v) voiceId = v.voice_id || v.id || v.voiceId || v.id;
      }
    }

    if (!voiceId) {
      throw new Error('No voice id provided and DEFAULT_ELEVEN_VOICE_ID not set');
    }

    const ssml = buildSSML({
      title: summaryObj.title || summaryObj.title_short,
      summary: summaryObj.summary || summaryObj.summary_80_120,
      hook: summaryObj.hook,
      question: summaryObj.question
    });

    const outFile = path.join(DATA_DIR, `${articleId}.mp3`);
    console.log(`[TTS] Generating audio for ${articleId} using voiceId=${voiceId}`);
    // ElevenLabs may or may not accept SSML; if it fails, the error will show; fallback to plain text later
    try {
      await generateAudioEleven(voiceId, ssml, outFile);
    } catch (err) {
      console.warn('[TTS] SSML generation failed, retrying with plain text. Error:', err.message);
      const plainText = `${summaryObj.title || ''}\n\n${summaryObj.summary || summaryObj.summary_80_120 || ''}\n\n${summaryObj.hook || ''}\n\n${summaryObj.question || ''}`;
      await generateAudioEleven(voiceId, plainText, outFile);
    }

    const s3Key = `audio/${articleId}.mp3`;
    await uploadToS3(outFile, s3Key, 'audio/mpeg');

    const signedUrl = generateSignedUrl(s3Key, 60 * 60 * 24);

// update summaries.json with metadata about this generation
summaryObj.audio_url = signedUrl;
summaryObj.generated_with = {
  voice_id: voiceId || null,
  humor_level: humorLevel || null,
  generated_at: new Date().toISOString()
};
summaries[idx] = summaryObj;
fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));

    console.log(`[TTS] Uploaded and updated summary with audio_url for ${articleId}`);
    return { success: true, audio_url: signedUrl, s3_key: s3Key };
  } catch (err) {
    console.error(`[TTS] Error for ${articleId}:`, err.message || err);
    throw err; // propagate so BullMQ can retry
  }
}

module.exports = { runForArticle, loadCachedVoices };
