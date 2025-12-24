require('dotenv').config();
const { Worker } = require('bullmq');
const path = require('path');

// ✅ File-based repos
const summaryRepo = require('../db/json/summaryRepo');
const audioRepo = require('../db/json/audioRepo');
const { uploadAudio, getSignedUrl } = require('../utils/s3');

// ✅ FIXED: Use your provider class correctly
const ElevenLabsProvider = require('../providers/tts/elevenlabs');
const ttsProvider = new ElevenLabsProvider();

function createAudioAsset(data) {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    summaryId: data.summaryId,
    articleId: data.articleId,
    mode: data.mode || 'default',
    voiceId: data.voiceId || 'default',
    s3Key: data.s3Key,
    audioUrl: data.audioUrl,
    createdAt: new Date().toISOString()
  };
}

console.log('🔊 TTS Worker started');

const worker = new Worker('tts', async (job) => {
  console.log(`[tts] Job received: ${job.name} →`, job.data);
  
  if (job.name !== 'audio-requested') {
    console.log(`[tts] Skipping job ${job.name} (expected audio-requested)`);
    return;
  }

  const { summaryId, voiceId, humorLevel } = job.data;
  const voiceToUse = voiceId || 'pNInz6obpgDQGcFmaJgB'; // Adam default

  console.log(`[tts] Processing ${summaryId} with voice ${voiceToUse.slice(0,8)}`);

  try {
    // Find summary (multiple strategies)
    let summary = summaryRepo.getById(summaryId) || 
                  summaryRepo.listByArticle(summaryId)[0] ||
                  summaryRepo.listAll().find(s => s.id === summaryId);
    
    if (!summary) throw new Error(`Summary not found: ${summaryId}`);

    // Dedupe check
    const existing = audioRepo.findBySummaryAndVoice(summaryId, voiceToUse);
    if (existing) {
      console.log('[tts] Audio exists, skipping:', existing.audioUrl);
      return existing;
    }

    // Get text to speak
    const textToSpeak = summary.summary || summary.summary_80_120 || summary.text || summary.content || '';
    if (!textToSpeak.trim()) throw new Error('No text to speak');

    console.log(`[tts] Text: ${textToSpeak.slice(0, 100)}...`);

    // ✅ FIXED TTS CALL - using synthesizeSpeech
    const audioResult = await ttsProvider.synthesizeSpeech(textToSpeak, { 
      voiceId: voiceToUse 
    });
    const audioBuffer = audioResult.buffer;

    // Upload to S3
    const s3Key = `audio/${summary.mode || 'default'}/${summaryId}_${voiceToUse.slice(0,8)}.mp3`;
    await uploadAudio(audioBuffer, s3Key);

    // Create & save asset
    const asset = createAudioAsset({
      summaryId,
      articleId: summary.articleId || summaryId,
      mode: summary.mode || 'default',
      voiceId: voiceToUse,
      s3Key,
      audioUrl: getSignedUrl(s3Key),
    });
    audioRepo.save(asset);

    // Update summaries.json (your app expects this)
    const fs = require('fs');
    const summariesPath = path.join(__dirname, '../summaries.json');
    if (fs.existsSync(summariesPath)) {
      let summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
      const summaryIdx = summaries.findIndex(s => s.id === summaryId);
      if (summaryIdx !== -1) {
        summaries[summaryIdx].audio_url = asset.audioUrl;
        summaries[summaryIdx].generated_with = { 
          voice_id: voiceToUse, 
          humor_level: humorLevel || 3 
        };
        fs.writeFileSync(summariesPath, JSON.stringify(summaries, null, 2));
      }
    }

    console.log(`[tts] ✅ COMPLETE: ${asset.audioUrl}`);
    return asset;

  } catch (error) {
    console.error(`[tts] ❌ FAILED ${summaryId}:`, error.message);
    throw error;
  }
}, {
  connection: { host: '127.0.0.1', port: 6379 },
});

worker.on('completed', (job) => console.log(`[tts] ✅ Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[tts] ❌ Job ${job.id} failed:`, err.message));
