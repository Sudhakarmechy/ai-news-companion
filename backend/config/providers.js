// backend/config/providers.js
require('dotenv').config();

/**
 * Central config for external AI providers.
 * You can change providers simply by editing .env:
 *   LLM_PROVIDER=gemini | openai | other
 *   TTS_PROVIDER=google | elevenlabs | other
 *   TRANSLATION_PROVIDER=gemini | google | other
 */

const config = {
  llm: process.env.LLM_PROVIDER || 'gemini',          // default: gemini for summaries, Q&A
  tts: process.env.TTS_PROVIDER || 'elevenlabs',      // default: elevenlabs for now
  translation: process.env.TRANSLATION_PROVIDER || 'gemini', // default: gemini translate
};

// ✅ REMOVED PROBLEMATIC TOP-LEVEL BLOCK
// No more fallbackSummary(article) calls at module scope!

module.exports = config;
