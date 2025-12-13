// backend/providers/tts/base.js

/**
 * TTS Provider Interface
 */
class TTSProvider {
  /**
   * Generate speech audio
   * @param {string} text
   * @param {Object} options { voiceId, language, persona, speed }
   * @returns {Promise<{ buffer, format }>}
   */
  async synthesizeSpeech(text, options = {}) {
    throw new Error('synthesizeSpeech() not implemented');
  }
}

module.exports = TTSProvider;
