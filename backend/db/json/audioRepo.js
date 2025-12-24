const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../audio_store.json');

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function save(asset) {
  const all = readAll();
  all.push(asset);
  writeAll(all);
  return asset;
}

function findBySummaryAndVoice(summaryId, voiceId) {
  return readAll().find(
    a => a.summaryId === summaryId && a.voiceId === voiceId
  );
}

module.exports = {
  save,
  findBySummaryAndVoice,
};
