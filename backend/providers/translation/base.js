// backend/providers/translation/base.js

/**
 * Translation Provider Interface
 */
class TranslationProvider {
  /**
   * Translate text
   * @param {string} text
   * @param {string} targetLang
   * @returns {Promise<string>}
   */
  async translateText(text, targetLang) {
    throw new Error('translateText() not implemented');
  }
}

module.exports = TranslationProvider;
