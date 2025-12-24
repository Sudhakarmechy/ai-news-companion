const crypto = require('crypto');

class AudioAsset {
  static create(data) {
    return {
      id: data.id || AudioAsset.generateId(
        data.summaryId,
        data.voiceId
      ),
      summaryId: data.summaryId,
      articleId: data.articleId,
      mode: data.mode,
      voiceId: data.voiceId,
      provider: data.provider || 'elevenlabs',
      s3Key: data.s3Key,
      audioUrl: data.audioUrl || null,
      durationSec: data.durationSec || null,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }

  static generateId(summaryId, voiceId) {
    return crypto
      .createHash('sha1')
      .update(`${summaryId}-${voiceId}`)
      .digest('hex');
  }
}

module.exports = AudioAsset;
