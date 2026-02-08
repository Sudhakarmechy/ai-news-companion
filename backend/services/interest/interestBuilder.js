const WEIGHTS = require('../../constants/interestWeights');
const { interestGraphRepo } = require('../../db');
const { createInterestGraph } = require('../../models/InterestGraph');
const { updateInterest } = require('./updateInterest');
const { normalizeCategory } = require('./normalizeCategory');
const { pruneInterests } = require('./pruneInterests');
const { canonicalizeCategory } = require('./categoryOntology');
const { computeTimeDecayFactor, MIN_SCORE } = require('./decayPolicy');

// function applyDelta(node, delta, event) {
//   node.score = Number((node.score + delta).toFixed(4));
//   node.updatedAt = new Date().toISOString();

//   if (!Array.isArray(node.lastEvents)) {
//     node.lastEvents = [];
//   }

//   node.lastEvents.unshift({
//     type: event.type,
//     articleId: event.articleId || null,
//     delta,
//     at: new Date().toISOString()
//   });

//   // 🔒 Keep only last 5 traces
//   node.lastEvents = node.lastEvents.slice(0, 5);

//   return node;
// }

function applyDelta(node, delta, event) {
  node.score = Number((node.score + delta).toFixed(4));
  node.updatedAt = new Date().toISOString();

  if (!Array.isArray(node.lastEvents)) {
    node.lastEvents = [];
  }

  node.lastEvents.unshift({
    type: event.type,
    articleId: event.articleId || event.metadata?.articleId || event.summaryId || null,
    delta,
    at: new Date().toISOString()
  });

  node.lastEvents = node.lastEvents.slice(0, 5);
  return node;
}


function extractTags({ summary, article }) {
  const tags = new Set();

  // 1. Explicit categories (future-proof)
  if (article?.categories?.length) {
    article.categories.forEach(c => tags.add(String(c).toLowerCase()));
  }

  // 2. Country & language (VERY IMPORTANT)
  if (article?.country) tags.add(String(article.country).toLowerCase());
  if (article?.language) tags.add(String(article.language).toLowerCase());

  // 3. Source
  if (article?.sourceDomain) tags.add(String(article.sourceDomain).toLowerCase());

  // 4. Keyword extraction (cheap but effective)
  const text = `${article?.title || ''} ${article?.description || ''}`.toLowerCase();

  const KEYWORDS = [
    'ai', 'technology', 'politics', 'election', 'government',
    'sports', 'cricket', 'football', 'economy', 'market',
    'startup', 'business', 'health', 'science'
  ];

  KEYWORDS.forEach(k => {
    if (text.includes(k)) tags.add(k);
  });

  return Array.from(tags);
}

async function updateInterestGraph({ userId, event, summary, article }) {
  const weight = WEIGHTS[event.type] || 0;
  if (weight === 0) return;

  let graph = await interestGraphRepo.getByUser(userId);
  if (!graph) {
    graph = createInterestGraph({ userId });
  }

  // ✅ Ensure interests object exists
  if (!graph.interests) graph.interests = {};

  const tags = extractTags({ summary, article });

  tags.forEach(tag => {
    const existing = graph.interests[tag] || { 
      score: 0, 
      updatedAt: new Date(0).toISOString() 
    };
    const updatedInterest = updateInterest({ 
      interest: existing, 
      eventType: event.type 
    });
    graph.interests[tag] = updatedInterest;
  });

  graph.updatedAt = new Date().toISOString();
  await interestGraphRepo.save(graph);
}

function applyDecay(interests, decayDays = 7, decayRate = 0.9) {
  const now = Date.now();
  const cutoff = decayDays * 24 * 60 * 60 * 1000;

  Object.keys(interests).forEach(key => {
    const interest = interests[key];
    const lastUpdated = new Date(interest.updatedAt).getTime();
    const age = now - lastUpdated;

    if (age > cutoff) {
      interest.score = Number((interest.score * decayRate).toFixed(4));
    }
  });

  return interests;
}

function applyEvent(graph, event) {
  const action = event.type || event.action;
  const rawCategory = event.metadata?.category || event.category;

  if (!rawCategory) return graph;

  const category = canonicalizeCategory(rawCategory);

  if (!graph.interests) graph.interests = {};

  // 1️⃣ Decay
  graph.interests = applyDecay(graph.interests);

  // 2️⃣ Delta
  let delta = WEIGHTS[action] ?? 0.1;
  delta *= category === 'general' ? 0.1 : 1.5;

if (delta < 0) {
  // Negative events are NOT boosted
  delta = delta;
} else {
  delta *= category === 'general' ? 0.1 : 1.5;
}
  
  // 3️⃣ Init canonical bucket
  if (!graph.interests[category]) {
    graph.interests[category] = {
      score: 0,
      updatedAt: new Date().toISOString(),
      lastEvents: []
    };
  }

  // 4️⃣ Apply delta
  applyDelta(graph.interests[category], delta, event);

if (action === 'not_interested' || action === 'downvote') {
  graph.interests[category].score = Math.min(
    graph.interests[category].score,
    -1
  );

  graph.interests[category].blockedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
}

  // 5️⃣ Conditional pruning (IMPORTANT)
  const totalScore = Object.values(graph.interests)
    .reduce((sum, i) => sum + i.score, 0);

  if (totalScore > 1) {
    graph.interests = pruneInterests(graph.interests);
  }

  graph.updatedAt = new Date().toISOString();
  return graph;
}

function applyTimeDecay(interests) {
  const decayed = {};
  const now = new Date().toISOString();

  for (const [category, data] of Object.entries(interests)) {
    const factor = computeTimeDecayFactor(data.updatedAt);
    const newScore = data.score * factor;

    if (newScore >= MIN_SCORE) {
      decayed[category] = {
        ...data,
        score: Number(newScore.toFixed(4)),
        updatedAt: now
      };
    }
  }

  return decayed;
}




module.exports = { updateInterestGraph, applyEvent };
