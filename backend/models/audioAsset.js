// backend/models/audioAsset.js

/**
 * @typedef {Object} AudioAsset
 * @property {string} id
 * @property {string} articleId
 * @property {string} summaryId
 * @property {'single'|'digest'} type
 * @property {string} url                    - Public/Signed URL to audio
 * @property {string|null} s3Key             - For AWS S3 storage
 * @property {string} language
 * @property {string} voiceId                - Provider-specific voice ID
 * @property {string} persona                - Our logical persona name
 * @property {string|null} provider          - e.g. 'elevenlabs', 'google-tts'
 * @property {number|null} durationSeconds
 * @property {number|null} sizeBytes
 * @property {string|null} waveformJson      - (optional) for visual waveform
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function createAudioAsset(data) {
  const now = new Date().toISOString();

  return {
    id: String(data.id),
    articleId: String(data.articleId),
    summaryId: String(data.summaryId),
    type: data.type || 'single',
    url: data.url || '',
    s3Key: data.s3Key || null,
    language: (data.language || 'en').toLowerCase(),
    voiceId: data.voiceId || '',
    persona: data.persona || 'neutral',
    provider: data.provider || null,
    durationSeconds: data.durationSeconds ?? null,
    sizeBytes: data.sizeBytes ?? null,
    waveformJson: data.waveformJson || null,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : now,
  };
}

function fromRaw(raw) {
  return createAudioAsset({
    id: raw.id,
    articleId: raw.articleId,
    summaryId: raw.summaryId,
    type: raw.type,
    url: raw.url || raw.audio_url,
    s3Key: raw.s3Key,
    language: raw.language,
    voiceId: raw.voiceId,
    persona: raw.persona,
    provider: raw.provider,
    durationSeconds: raw.durationSeconds,
    sizeBytes: raw.sizeBytes,
    waveformJson: raw.waveformJson,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

module.exports = {
  createAudioAsset,
  fromRaw,
};
