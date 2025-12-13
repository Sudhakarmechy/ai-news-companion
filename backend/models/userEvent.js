// backend/models/userEvent.js

/**
 * @typedef {Object} UserEvent
 * @property {string} id
 * @property {string} userId
 * @property {'play'|'pause'|'stop'|'skip'|'like'|'dislike'|'share'|'search'|'open_story'|'complete_audio'} type
 * @property {string|null} articleId
 * @property {string|null} summaryId
 * @property {string|null} audioId
 * @property {number|null} positionSeconds
 * @property {Object} meta
 * @property {string} createdAt
 */

function createUserEvent(data) {
  const now = new Date().toISOString();

  return {
    id: String(data.id),
    userId: String(data.userId),
    type: data.type,
    articleId: data.articleId || null,
    summaryId: data.summaryId || null,
    audioId: data.audioId || null,
    positionSeconds: data.positionSeconds ?? null,
    meta: data.meta || {},
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now,
  };
}

function fromRaw(raw) {
  return createUserEvent({
    id: raw.id,
    userId: raw.userId,
    type: raw.type,
    articleId: raw.articleId,
    summaryId: raw.summaryId,
    audioId: raw.audioId,
    positionSeconds: raw.positionSeconds,
    meta: raw.meta,
    createdAt: raw.createdAt,
  });
}

module.exports = {
  createUserEvent,
  fromRaw,
};
