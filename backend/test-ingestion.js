// backend/test-ingestion.js
require('dotenv').config();
const axios = require('axios');
const xml2js = require('xml2js');

const { publishArticleIngested } = require('./queues/publishers');
const { articleRepo } = require('./db');
const { Article } = require('./models');  // IMPORTANT!

const RSS_URL = `https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en`;

// ✅ ADDED: Category inference function
function inferCategory(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase();

  if (text.includes('election') || text.includes('government')) return ['politics'];
  if (text.includes('stock') || text.includes('market')) return ['business'];
  if (text.includes('ai') || text.includes('technology')) return ['technology'];
  if (text.includes('cricket') || text.includes('football')) return ['sports'];

  return ['general'];
}

async function fetchRSS() {
  const xml = (await axios.get(RSS_URL)).data;

  const parsed = await xml2js.parseStringPromise(xml, {
    trim: true,
    normalizeTags: true,
    mergeAttrs: true,
  });

  const items = parsed?.rss?.channel?.[0]?.item || [];

  return items.map((i) => ({
    id:
      typeof i.guid?.[0] === "object"
        ? i.guid[0]._                  // FIX: extract string
        : i.guid?.[0] || i.link?.[0],

    title: i.title?.[0] || "",
    url: i.link?.[0] || "",
    link: i.link?.[0] || "",
    
    description: i.description?.[0] || "",
    rawText: i.description?.[0] || "",
    
    pubDate: i.pubdate?.[0] || i.pubDate?.[0] || null,
  }));
}

(async () => {
  console.log("[ingestion] Fetching RSS...");

  const rssArticles = await fetchRSS();
  console.log(`[ingestion] Found ${rssArticles.length} articles`);

  let count = 0;

  for (const raw of rssArticles) {
    // ✅ INFER CATEGORY BEFORE CREATING ARTICLE
    const categories = inferCategory(raw.title, raw.description);
    
    // CONVERT to our internal model + ADD CATEGORIES
    const article = Article.create({
      ...raw,
      categories  // ✅ Auto-categorize every article
    });

    const inserted = articleRepo.upsertArticle(article);

    if (inserted) {
      console.log(`→ Queuing ARTICLE_INGESTED: ${article.id} [${categories.join(', ')}]`);
      await publishArticleIngested(article.id);
      count++;
    }
  }

  console.log(`[ingestion] Stored & queued ${count} new articles.`);
  process.exit(0);
})();
