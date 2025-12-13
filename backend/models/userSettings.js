// backend/models/userSettings.js

/**
 * @typedef {Object} UserSettings
 * @property {string} userId
 * @property {string} country
 * @property {string[]} regions
 * @property {string[]} contentLangs
 * @property {string} uiLang
 * @property {string[]} categories
 * @property {'brief'|'detailed'|'mixed'} preferredMode
 * @property {string} defaultPersona
 * @property {number} defaultHumorLevel    - range 0–10
 * @property {number} defaultSpeed         - e.g. 1.0
 * @property {boolean} reduceDisturbing
 * @property {boolean} limitNightNotifs
 * @property {string} createdAt
 * @property {string} updatedAt
 */

function createUserSettings(data) {
  const now = new Date().toISOString();

  return {
    userId: String(data.userId),
    country: (data.country || 'IN').toUpperCase(),
    regions: Array.isArray(data.regions) ? data.regions : [],
    contentLangs: Array.isArray(data.contentLangs) ? data.contentLangs : ['en'],
    uiLang: (data.uiLang || 'en').toLowerCase(),
    categories: Array.isArray(data.categories) ? data.categories : [],
    preferredMode: data.preferredMode || 'mixed',
    defaultPersona: data.defaultPersona || 'neutral',
    defaultHumorLevel: typeof data.defaultHumorLevel === 'number' ? data.defaultHumorLevel : 3,
    defaultSpeed: typeof data.defaultSpeed === 'number' ? data.defaultSpeed : 1.0,
    reduceDisturbing: !!data.reduceDisturbing,
    limitNightNotifs: !!data.limitNightNotifs,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : now,
  };
}

function fromRaw(raw) {
  return createUserSettings(raw);
}

module.exports = {
  createUserSettings,
  fromRaw,
};
