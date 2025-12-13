// backend/models/index.js

const { createArticle, fromRaw: articleFromRaw } = require('./article');
const { createSummary, fromRaw: summaryFromRaw } = require('./summary');
const { createAudioAsset, fromRaw: audioFromRaw } = require('./audioAsset');
const { createUserEvent, fromRaw: eventFromRaw } = require('./userEvent');
const { createUserSettings, fromRaw: settingsFromRaw } = require('./userSettings');

module.exports = {
  Article: { create: createArticle, fromRaw: articleFromRaw },
  Summary: { create: createSummary, fromRaw: summaryFromRaw },
  AudioAsset: { create: createAudioAsset, fromRaw: audioFromRaw },
  UserEvent: { create: createUserEvent, fromRaw: eventFromRaw },
  UserSettings: { create: createUserSettings, fromRaw: settingsFromRaw },
};
