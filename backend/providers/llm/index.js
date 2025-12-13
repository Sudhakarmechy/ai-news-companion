// backend/providers/llm/index.js
const providerConfig = require('../../config/providers');

function getLLMProvider() {
  switch (config.llm) {
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unsupported LLM provider: ${config.llm}`);
  }
}

module.exports = { getLLMProvider };
