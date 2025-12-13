// backend/db/json/baseJsonRepo.js
const fs = require('fs');
const path = require('path');

function loadJson(file) {
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('[jsonRepo] Failed to read', file, err.message);
    return [];
  }
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[jsonRepo] Failed to write', file, err.message);
  }
}

/**
 * Create a basic JSON repo
 * @param {string} filename
 * @param {(raw:any)=>any} fromRaw  - mapper to model
 */
function createJsonRepo(filename, fromRaw) {
  const FILE = path.join(__dirname, '..', '..', filename);

  function list(filterFn = null) {
    const all = loadJson(FILE).map(fromRaw);
    return filterFn ? all.filter(filterFn) : all;
  }

  function getById(id) {
    const all = loadJson(FILE);
    const raw = all.find(x => String(x.id) === String(id));
    return raw ? fromRaw(raw) : null;
  }

  function upsert(entity) {
    const all = loadJson(FILE);
    const idx = all.findIndex(x => String(x.id) === String(entity.id));
    const plain = { ...entity };

    if (idx === -1) {
      all.push(plain);
    } else {
      all[idx] = plain;
    }
    saveJson(FILE, all);
    return entity;
  }

  return { list, getById, upsert };
}

module.exports = { createJsonRepo };
