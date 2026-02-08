const ALIASES = {
  ai: 'technology',
  artificial_intelligence: 'technology',
  tech: 'technology',
  gnneral: 'general',
  news: 'general',
};

function normalizeCategory(raw) {
  if (!raw) return 'general';

  const key = raw.toLowerCase().trim();
  return ALIASES[key] || key;
}

module.exports = { normalizeCategory };
