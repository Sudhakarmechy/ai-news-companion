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

module.exports = {
  saveDigest,
  findByUser,
  findPublic,
};
