// backend/fetchNews.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NEWSAPI_KEY = process.env.NEWSAPI_KEY1;

if (!NEWSAPI_KEY) {
  console.error("Missing NEWSAPI_KEY1 in .env");
  process.exit(1);
}

async function fetchNews() {
  try {
    const url = `https://newsapi.org/v2/everything`;
    const params = {
    q:'india',
      countries: 'in',      // India (note: 'countries' plural for /everything)
      pageSize: 5,          // fetch 5 for now
      sortBy: 'publishedAt', // Or 'popularity' for top-like results
      language: 'en',       // English articles
      apiKey: NEWSAPI_KEY,
    };

    const response = await axios.get(url, { params });

    console.log('Full API Response:', JSON.stringify(response.data, null, 2));  // Debug log

    if (response.data.status !== 'ok') {
      console.error("NewsAPI error:", response.data);
      return;
    }

    const articles = response.data.articles || [];
    console.log(`Fetched ${articles.length} articles. Total available: ${response.data.totalResults}`);

    // Normalize and save locally for now
    const normalized = articles.map((a, index) => ({
      id: `news_${Date.now()}_${index}`,
      source: a.source?.name || "unknown",
      author: a.author,
      title: a.title,
      description: a.description,
      url: a.url,
      publishedAt: a.publishedAt,
      content: a.content,
    }));

    const outPath = path.join(__dirname, 'fetchedArticles.json');
    fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2));

    console.log(`Saved to ${outPath}`);
  } catch (err) {
    console.error("Error fetching news:", err.response?.data || err.message);
  }
}

fetchNews();