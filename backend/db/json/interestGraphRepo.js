const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../interest_graphs.json');

function readAll() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getByUser(userId) {
  return readAll().find(g => g.userId === userId) || null;
}

function save(graph) {
  const all = readAll();
  const idx = all.findIndex(g => g.userId === graph.userId);

  if (idx >= 0) all[idx] = graph;
  else all.push(graph);

  writeAll(all);
  return graph;
}

module.exports = {
  getByUser,
  save
};
