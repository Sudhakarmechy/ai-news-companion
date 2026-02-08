// categoryOntology.js

const CATEGORY_ALIASES = {
  technology: [
    'tech',
    'technology',
    'ai',
    'artificial intelligence',
    'machine learning',
    'ml',
    'deep learning',
    'startup',
    'software',
    'programming',
    'coding'
  ],

  finance: [
    'finance',
    'business',
    'economy',
    'markets',
    'stocks',
    'crypto',
    'bitcoin'
  ],

  sports: [
    'sports',
    'cricket',
    'football',
    'soccer',
    'tennis'
  ],

  politics: [
    'politics',
    'government',
    'election',
    'policy'
  ]
};

// Reverse lookup
const LOOKUP = {};
for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
  aliases.forEach(a => {
    LOOKUP[a.toLowerCase()] = canonical;
  });
}

function canonicalizeCategory(category) {
  if (!category) return 'general';
  const key = String(category).toLowerCase().trim();
  return LOOKUP[key] || key;
}

module.exports = {
  canonicalizeCategory
};
