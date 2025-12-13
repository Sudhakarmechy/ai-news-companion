// backend/providers/tts/index.js
const providerConfig = require('../../config/providers');

function getTTSProvider() {
  switch (config.tts) {
    case 'elevenlabs':
      return new ElevenLabsProvider();
    default:
      throw new Error(`Unsupported TTS provider: ${config.tts}`);
  }
}

module.exports = { getTTSProvider };
