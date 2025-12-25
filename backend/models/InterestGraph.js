function createInterestGraph({ userId, interests = {} }) {
  return {
    userId,
    interests, // { key: weight }
    updatedAt: new Date().toISOString()
  };
}

module.exports = { createInterestGraph };
