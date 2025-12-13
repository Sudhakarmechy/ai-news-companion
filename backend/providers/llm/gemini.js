// backend/providers/llm/gemini.js
const LLMProvider = require('./base');

/**
 * NOTE:
 * We are NOT calling Gemini SDK yet.
 * This keeps things safe while wiring architecture.
 */
class GeminiProvider extends LLMProvider {
  async summarizeArticle(article, options = {}) {
    const { mode = 'brief', language = 'en', humorLevel = 3 } = options;

    // TEMP response (replace in Phase 3)
    return {
      text: `[${mode.toUpperCase()}][${language}] Summary placeholder for "${article.title}"`,
      hook: 'This is a temporary hook',
      question: 'Want a deeper explanation?',
      tags: article.categories || [],
    };
  }

  async answerQuestion(context, question) {
    return `Temporary Gemini answer for question: "${question}"`;
  }
}

module.exports = GeminiProvider;
