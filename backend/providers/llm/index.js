const config = require('../../config/providers');
const GeminiProvider = require('./gemini');

function getLLMProvider() {
  switch (config.llm) {
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unsupported LLM provider: ${config.llm}`);
  }
}

module.exports = { getLLMProvider };
