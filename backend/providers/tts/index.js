// backend/providers/tts/index.js
const config = require('../../config/providers');
const ElevenLabsProvider = require('./elevenlabs');

function getTTSProvider() {
  switch (config.tts) {
    case 'elevenlabs':
      return new ElevenLabsProvider();
    default:
      throw new Error(`Unsupported TTS provider: ${config.tts}`);
  }
}

module.exports = { getTTSProvider };
