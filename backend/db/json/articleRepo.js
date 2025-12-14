
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'articles.json');

console.log("🧭 ArticleRepo using file:", DATA_FILE);
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

function getArticleById(id) {
  const articles = readAll();
  return articles.find(a => a.id === id);
}

module.exports = {
    upsertArticle,
  getAll: readAll,
  getArticleById,
  DATA_FILE
};
