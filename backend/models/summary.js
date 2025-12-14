// backend/models/Summary.js
const crypto = require('crypto');

class Summary {
  static create(data) {
    return {
      id: data.id || Summary.generateId(data.articleId, data.mode, data.language),
      articleId: data.articleId,
      mode: data.mode,
      language: data.language,
      text: data.text || "",
      hook: data.hook || "",
      question: data.question || "",
      createdAt: data.createdAt || new Date().toISOString(),
    };
  }

  static generateId(articleId, mode, language) {
    return crypto
      .createHash('sha1')
      .update(`${articleId}-${mode}-${language}`)
      .digest('hex');
  }
}

module.exports = Summary;
