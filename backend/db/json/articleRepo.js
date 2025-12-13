// // backend/db/json/articleRepo.js
// const { createJsonRepo } = require('./baseJsonRepo');
// const { Article } = require('../../models');

// // we’ll store articles in backend/articles.json
// const repo = createJsonRepo('articles.json', Article.fromRaw);

// function listByFilter({ country, region, language, category, limit = 50 } = {}) {
//   let items = repo.list();

//   if (country) items = items.filter(a => a.country === country.toUpperCase());
//   if (region) items = items.filter(a => a.region === region);
//   if (language) items = items.filter(a => a.language === language.toLowerCase());
//   if (category) items = items.filter(a => (a.categories || []).includes(category));

//   items.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
//   return items.slice(0, limit);
// }

// function upsertArticle(article) {
//   return repo.upsert(article);
// }

// function getArticleById(id) {
//   return repo.getById(id);
// }

// module.exports = {
//   listByFilter,
//   upsertArticle,
//   getArticleById,
// };


// backend/db/articleRepo.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../articles.json');

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeAll(articles) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
}

function upsertArticle(article) {
  const articles = readAll();
  const index = articles.findIndex(a => a.id === article.id);

  if (index !== -1) {
    // already exists → skip (dedup)
    return false;
  }

  articles.push(article);
  writeAll(articles);
  return true;
}

module.exports = {
  upsertArticle,
  getAll: readAll,
};
