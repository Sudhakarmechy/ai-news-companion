const crypto = require('crypto');

class Digest {
  static create(data) {
    return {
      id: data.id || Digest.generateId(data),
      userId: data.userId || null, // null = public digest
      type: data.type,             // daily | trending | category | evening
      context: {
        category: data.category || null,
        country: data.country || null,
        language: data.language || 'en',
      },
      summaryIds: data.summaryIds || [],
      articleIds: data.articleIds || [],
      generatedAt: new Date().toISOString(),
      expiresAt: data.expiresAt || null,
      metadata: data.metadata || {},
    };
  }

  static generateId(data) {
    const base = `${data.userId || 'public'}-${data.type}-${Date.now()}`;
    return crypto.createHash('sha1').update(base).digest('hex');
  }
}

module.exports = Digest;
