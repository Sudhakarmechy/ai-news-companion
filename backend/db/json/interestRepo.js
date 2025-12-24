const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../interest_store.json');

function readAll() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function saveAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function update(userId, key, delta) {
  const data = readAll();
  data[userId] = data[userId] || {};
  data[userId][key] = (data[userId][key] || 0) + delta;
  saveAll(data);
}

function get(userId) {
  return readAll()[userId] || {};
}

module.exports = { update, get };
