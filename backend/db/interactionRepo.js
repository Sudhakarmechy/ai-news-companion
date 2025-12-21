const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'json', 'interactions.json');

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function track(event) {
  const data = load();
  data.push({
    id: crypto.randomUUID(),
    ...event,
    timestamp: new Date().toISOString(),
  });
  save(data);
}

function getByUser(userId) {
  return load().filter(e => e.userId === userId);
}

module.exports = {
  track,
  getByUser
};
