const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../user_events.json');

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function save(event) {
  const all = readAll();
  all.push(event);
  writeAll(all);
  return event;
}

function listByUser(userId) {
  return readAll().filter(e => e.userId === userId);
}

module.exports = {
  save,
  listByUser
};
