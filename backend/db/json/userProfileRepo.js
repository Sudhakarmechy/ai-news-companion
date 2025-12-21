const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'user_profiles.json');

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function saveProfile(profile) {
  const all = readAll();
  const idx = all.findIndex(p => p.userId === profile.userId);

  if (idx !== -1) all[idx] = profile;
  else all.push(profile);

  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
}

function getProfile(userId) {
  return readAll().find(p => p.userId === userId);
}

module.exports = { saveProfile, getProfile };
