// backend/providers/translation/gemini.js
const TranslationProvider = require('./base');

class GeminiTranslationProvider extends TranslationProvider {
  async translateText(text, targetLang) {
    // TEMP stub
    return `[${targetLang}] ${text}`;
  }
}

module.exports = GeminiTranslationProvider;
