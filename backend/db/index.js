// backend/db/index.js
const { DB_PROVIDER } = require('../config/db');

let articleRepo, summaryRepo, audioRepo, userEventRepo, userSettingsRepo;

if (DB_PROVIDER === 'postgres') {
  // Future: real Postgres repos
  // articleRepo = require('./pg/articleRepo');
  // summaryRepo = require('./pg/summaryRepo');
  // audioRepo = require('./pg/audioRepo');
  // userEventRepo = require('./pg/userEventRepo');
  // userSettingsRepo = require('./pg/userSettingsRepo');
  throw new Error('Postgres provider not implemented yet. Set DB_PROVIDER=json for now.');
} else {
  // JSON-based repos (dev mode, what we’ll implement now)
  articleRepo = require('./json/articleRepo');
  summaryRepo = require('./json/summaryRepo');
  audioRepo = require('./json/audioRepo');
  userEventRepo = require('./json/userEventRepo');
  userSettingsRepo = require('./json/userSettingsRepo');
}

module.exports = {
  articleRepo,
  summaryRepo,
  audioRepo,
  userEventRepo,
  userSettingsRepo,
};

//const { articleRepo } = require('../db');
