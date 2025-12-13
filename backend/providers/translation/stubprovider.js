// backend/providers/translation/stubProvider.js
async function translateText(text, targetLang, options = {}) {
  // For now, just return original text so things won't crash.
  return text;
}

module.exports = { translateText };
