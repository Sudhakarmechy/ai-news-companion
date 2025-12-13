// backend/providers/translation/index.js
const providerConfig = require('../../config/providers');
const GeminiTranslationProvider = require('./gemini');

function getTranslationProvider() {
  switch (config.translation) {
    case 'gemini':
      return new GeminiTranslationProvider();
    default:
      throw new Error(`Unsupported translation provider: ${config.translation}`);
  }
}

module.exports = { getTranslationProvider };
