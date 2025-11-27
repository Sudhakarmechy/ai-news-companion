// backend/ttsWorker.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AWS = require('aws-sdk');

const ELEVEN_KEY = process.env.ELEVEN_API_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

AWS.config.update({ region: AWS_REGION });
const s3 = new AWS.S3();

const DATA_DIR = __dirname;

function escapeXml(str = '') {
  return String(str)
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

// ElevenLabs TTS call - fall back to plain text if SSML is not supported
async function generateAudioEleven(voice = '2EiwWnXFnvU5JabPnv8n', ssml = '', outPath = '/tmp/out.mp3') {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;
  const body = { text: ssml }; // if SSML not supported, pass plain text instead
  const headers = { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' };

  const resp = await axios.post(url, body, {
    headers,
    responseType: 'arraybuffer',
    timeout: 120000
  });

  fs.writeFileSync(outPath, Buffer.from(resp.data));
  return outPath;
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

async function runForArticle(articleId, voicePreset = '2EiwWnXFnvU5JabPnv8n', humorLevel = 3) {
  try {
    const summariesPath = path.join(DATA_DIR, 'summaries.json');

    if (!fs.existsSync(summariesPath)) throw new Error('summaries.json missing');
    const summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
    const idx = summaries.findIndex(s => s.id === articleId);
    if (idx === -1) throw new Error(`Article ${articleId} not found in summaries.json`);

    const summaryObj = summaries[idx];

    const ssml = buildSSML({
      title: summaryObj.title || summaryObj.title_short,
      summary: summaryObj.summary || summaryObj.summary_80_120,
      hook: summaryObj.hook,
      question: summaryObj.question
    });

    const outFile = path.join(DATA_DIR, `${articleId}.mp3`);
    console.log(`[TTS] Generating audio for ${articleId}`);
    await generateAudioEleven(voicePreset, ssml, outFile);

    const s3Key = `audio/${articleId}.mp3`;
    await uploadToS3(outFile, s3Key, 'audio/mpeg');

    const signedUrl = generateSignedUrl(s3Key, 60 * 60 * 24);

    // update summaries.json
    summaryObj.audio_url = signedUrl;
    summaries[idx] = summaryObj;
    fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));

    console.log(`[TTS] Uploaded and updated summary with audio_url for ${articleId}`);
    return { success: true, audio_url: signedUrl, s3_key: s3Key };
  } catch (err) {
    console.error(`[TTS] Error for ${articleId}:`, err?.message || err);
    throw err; // propagate so BullMQ can retry
  }
}

// Export single function
module.exports = { runForArticle };
