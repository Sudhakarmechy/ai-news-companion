// backend/providers/tts/elevenlabs.js
const TTSProvider = require('./base');

class ElevenLabsProvider extends TTSProvider {
  async synthesizeSpeech(text, options = {}) {
    const { voiceId = 'default', language = 'en' } = options;

    // TEMP stub – real API already exists in your project
    return {
      buffer: Buffer.from(`FAKE_AUDIO_${voiceId}_${language}`),
      format: 'mp3',
    };
  }
}

module.exports = ElevenLabsProvider;
