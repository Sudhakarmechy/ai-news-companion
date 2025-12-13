// backend/providers/llm/base.js

/**
 * LLM Provider Interface
 * Every LLM provider MUST implement these methods.
 */
class LLMProvider {
  /**
   * Generate summary for an article
   * @param {Object} article
   * @param {Object} options { mode, language, humorLevel }
   * @returns {Promise<{ text, hook?, question?, tags? }>}
   */
  async summarizeArticle(article, options = {}) {
    throw new Error('summarizeArticle() not implemented');
  }

  /**
   * Answer a question based on article/context
   * @param {string} context
   * @param {string} question
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async answerQuestion(context, question, options = {}) {
    throw new Error('answerQuestion() not implemented');
  }
}

module.exports = LLMProvider;
