const DIGEST_RULES = {
  daily: {
    freshnessHours: 148,
    avoidRepeats: true,
    diversify: true
  },
  trending: {
    freshnessHours: 148,
    avoidRepeats: false,
    diversify: true
  },
  evening: {
    freshnessHours: 112,
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