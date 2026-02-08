function explainFeedMeta({ confidence, isColdUser }) {
  if (confidence === 0) {
    return 'Showing popular and recent news while we learn your interests';
  }

  if (confidence < 0.4) {
    return 'Partially personalized based on your recent activity';
  }

  if (confidence < 0.8) {
    return 'Mostly personalized for you';
  }

  return 'Fully personalized based on your interests';
}

module.exports = { explainFeedMeta };
