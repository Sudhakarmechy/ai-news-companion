function createUserProfile(userId) {
  return {
    userId,
    categoryAffinity: {},     // politics: 3.2, tech: 1.1
    languageAffinity: {},     // en: 5, ta: 2
    sourceAffinity: {},       // BBC: 2, TOI: 4
    audioAffinity: 0,         // prefers audio or not
    updatedAt: new Date().toISOString()
  };
}

module.exports = { createUserProfile };
