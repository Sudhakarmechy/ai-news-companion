// backend/config/providers.js
require('dotenv').config();

/**
 * Central config for external AI providers.
 * We will read these in our provider factory functions.
 *
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

module.exports = config;
