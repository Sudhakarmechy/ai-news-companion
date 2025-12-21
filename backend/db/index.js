// backend/db/index.js
const { DB_PROVIDER } = require('../config/db');

// IMPORTANT: Load models from /models, not /db
const { Article, Summary } = require('../models');

let articleRepo, summaryRepo, audioRepo, userEventRepo, userSettingsRepo;

if (DB_PROVIDER === 'postgres') {
  throw new Error('Postgres provider not implemented yet. Set DB_PROVIDER=json for now.');
} else {
  articleRepo = require('./json/articleRepo');
  summaryRepo = require('./json/summaryRepo');
  audioRepo = require('./json/audioRepo');
  userEventRepo = require('./json/userEventRepo');
  userSettingsRepo = require('./json/userSettingsRepo');
  digestRepo = require('./json/digestRepo');
}

module.exports = {
  articleRepo,
  summaryRepo,
  audioRepo,
  userEventRepo,
  userSettingsRepo,
  digestRepo,
  // Export models correctly:
  Article,
  Summary,
};
