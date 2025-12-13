// backend/db/json/audioRepo.js
const { createJsonRepo } = require('./baseJsonRepo');
const { AudioAsset } = require('../../models');

// store audio assets in backend/audio_assets.json
const repo = createJsonRepo('audio_assets.json', AudioAsset.fromRaw);

function getById(id) {
  return repo.getById(id);
}

function listByArticle(articleId) {
  return repo.list(a => a.articleId === String(articleId));
}

function upsertAudio(audio) {
  return repo.upsert(audio);
}

module.exports = {
  getById,
  listByArticle,
  upsertAudio,
};
