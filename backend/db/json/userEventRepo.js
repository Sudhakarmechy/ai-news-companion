const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'user_events.json');

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(events) {
  fs.writeFileSync(FILE, JSON.stringify(events, null, 2));
}

function logEvent(event) {
  const events = readAll();
  events.push(event);
  writeAll(events);
}

function listByUser(userId) {
  return readAll().filter(e => e.userId === userId);
}

module.exports = {
  logEvent,
  listByUser
};
