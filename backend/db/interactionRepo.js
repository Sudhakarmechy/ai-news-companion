const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'json', 'interactions.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function load() {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    console.warn('[interactionRepo] Corrupted file, resetting');
    return [];
  }
}

function save(data) {
  ensureDir(path.dirname(FILE));
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function track(event) {
  const data = load();
  data.push({
    id: crypto.randomUUID(),
    ...event,
    timestamp: new Date().toISOString(),
  });
  save(data.slice(-5000));  // Keep last 5000 (~10MB max)
}

function getByUser(userId) {
  return load().filter(e => e.userId === userId).slice(-100);  // Recent 100 only
}

module.exports = {
  track,
  getByUser
};
