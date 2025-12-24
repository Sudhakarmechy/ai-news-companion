const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'digests.json');

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function saveDigest(digest) {
  const all = readAll();
  all.push(digest);
  writeAll(all);
  return digest;
}

function findByUser(userId) {
  return readAll().filter(d => d.userId === userId);
}

function findPublic(type) {
  return readAll().filter(d => d.userId === null && d.type === type);
}

function findValidDigest({ type, userId, category, ttlMs }) {
  const now = Date.now();
  const all = readAll();

  return all.find(d => {
    if (d.type !== type) return false;
    if ((d.userId || null) !== (userId || null)) return false;
    if ((d.context?.category || null) !== (category || null)) return false;

    const age = now - new Date(d.generatedAt).getTime();
    return age <= ttlMs;
  });
}

module.exports = {
  saveDigest,
  findByUser,
  findPublic,
  findValidDigest,
};
