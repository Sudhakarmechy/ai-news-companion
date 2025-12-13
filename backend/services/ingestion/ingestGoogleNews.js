// backend/services/ingestion/ingestGoogleNews.js
const { publishArticleIngested, publishSummaryRequested } =
  require('../../queues/publishers');


const { fetchGoogleNews } = require('./googleNewsFetcher');
const { normalizeArticle } = require('./articleNormalizer');
const { classifyCategories } = require('./categoryClassifier');
const { articleRepo } = require('../../db');

async function ingestGoogleNews({ country = 'IN', language = 'en' } = {}) {
  console.log(`[ingestion] Starting Google News ingestion for ${country}/${language}`);

  const rawItems = await fetchGoogleNews({ country, language });

  let stored = 0;
  let skipped = 0;

 for (const raw of rawItems) {
  const article = normalizeArticle(raw, { country, language });

  article.categories = classifyCategories(
    `${article.title} ${article.description}`
  );

  const inserted = articleRepo.upsertArticle(article);

  if (inserted) {
    // 🟢 Emit event ONLY for new articles
    await publishArticleIngested(article.id);

    // 🟢 Immediately request summary (brief by default)
    await publishSummaryRequested(article.id, {
      mode: 'brief',
      language,
    });

    stored++;
  } else {
    skipped++;
  }
}


  console.log(`[ingestion] Stored=${stored}, Skipped(duplicate)=${skipped}`);
  return { stored, skipped };
}

module.exports = {
  ingestGoogleNews,
};
