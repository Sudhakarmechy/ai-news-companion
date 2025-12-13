// backend/db/json/userSettingsRepo.js
const { createJsonRepo } = require('./baseJsonRepo');
const { UserSettings } = require('../../models');

// store user settings in backend/user_settings.json
const repo = createJsonRepo('user_settings.json', UserSettings.fromRaw);

function getByUserId(userId) {
  const all = repo.list();
  return all.find(s => s.userId === String(userId)) || null;
}

function saveSettings(settings) {
  return repo.upsert(settings);
}

module.exports = {
  getByUserId,
  saveSettings,
};
 