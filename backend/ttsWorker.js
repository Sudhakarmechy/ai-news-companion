// backend/ttsWorker.js

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AWS = require('aws-sdk');

// Correct path!
const { summaryRepo, articleRepo } = require('./db');

const ELEVEN_KEY = process.env.ELEVEN_API_KEY;
const S3_BUCKET = process.env.S3_BUCKET;

AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });
const s3 = new AWS.S3();

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildSSML({ title, text, hook, question }) {
  return `<speak>
    <p>${escapeXml(title)}</p>
    <p>${escapeXml(text)}</p>
    <p>${escapeXml(hook)}</p>
    <p>${escapeXml(question)}</p>
  </speak>`;
}

async function generateAudioEleven(voiceId, text, outPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const resp = await axios.post(url, { text }, {
    headers: {
      "xi-api-key": ELEVEN_KEY,
      "Content-Type": "application/json",
    },
    responseType: "arraybuffer"
  });

  fs.writeFileSync(outPath, Buffer.from(resp.data));
  return outPath;
}

async function uploadToS3(localPath, key) {
  return s3.putObject({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fs.readFileSync(localPath),
    ContentType: "audio/mpeg",
    ACL: "private"
  }).promise();
}

module.exports.runTTS = async function (job) {
  const { summaryId, voiceId, humorLevel } = job.data;

  const summary = summaryRepo.getById(summaryId);
  if (!summary) throw new Error("Summary not found");

  const article = articleRepo.getArticleById(summary.articleId);
  if (!article) throw new Error("Article not found");

  const ssml = buildSSML({
    title: article.title || "News Update",
    text: summary.text,
    hook: summary.hook,
    question: summary.question
  });

  const localFile = path.join(__dirname, `${summaryId}.mp3`);
  await generateAudioEleven(voiceId, ssml, localFile);

  const s3Key = `audio/${summaryId}.mp3`;
  await uploadToS3(localFile, s3Key);

  const signedUrl = s3.getSignedUrl("getObject", {
    Bucket: S3_BUCKET,
    Key: s3Key,
    Expires: 86400
  });

  summary.audio_url = signedUrl;
  summary.generated_with = { voiceId, humorLevel };

  summaryRepo.upsertSummary(summary);

  return { summaryId, audio_url: signedUrl };
};
