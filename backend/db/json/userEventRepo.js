// backend/db/json/userEventRepo.js
const { createJsonRepo } = require('./baseJsonRepo');
const { UserEvent } = require('../../models');

// store user events in backend/user_events.json
const repo = createJsonRepo('user_events.json', UserEvent.fromRaw);

function logEvent(evt) {
  return repo.upsert(evt);
}

// For analytics/personalization
function listByUser(userId, { limit = 200 } = {}) {
  const events = repo
    .list(e => e.userId === String(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return events.slice(0, limit);
}

module.exports = {
  logEvent,
  listByUser,
};
