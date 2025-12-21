const DIGEST_RULES = {
  daily: {
    freshnessHours: 24,
    avoidRepeats: true,
    diversify: true
  },
  trending: {
    freshnessHours: 48,
    avoidRepeats: false,
    diversify: true
  },
  evening: {
    freshnessHours: 12,
    avoidRepeats: true,
    diversify: false
  },
  category: {
    freshnessHours: 48,
    avoidRepeats: true,
    diversify: false
  }
};

module.exports = {
  DIGEST_RULES
};