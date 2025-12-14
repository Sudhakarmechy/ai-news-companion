// // backend/models/index.js

// const { createArticle, fromRaw: articleFromRaw } = require('./article');
// const { createSummary, fromRaw: summaryFromRaw } = require('./Summary');
// const { createAudioAsset, fromRaw: audioFromRaw } = require('./audioAsset');
// const { createUserEvent, fromRaw: eventFromRaw } = require('./userEvent');
// const { createUserSettings, fromRaw: settingsFromRaw } = require('./userSettings');

// module.exports = {
//   Article: { create: createArticle, fromRaw: articleFromRaw },
//   Summary: { create: createSummary, fromRaw: summaryFromRaw },
//   AudioAsset: { create: createAudioAsset, fromRaw: audioFromRaw },
//   UserEvent: { create: createUserEvent, fromRaw: eventFromRaw },
//   UserSettings: { create: createUserSettings, fromRaw: settingsFromRaw },
// };


const { createArticle, fromRaw: articleFromRaw } = require('./article');
const Summary = require('./summary');
const AudioAsset = require('./audioAsset');
const UserEvent = require('./userEvent');
const UserSettings = require('./userSettings');

module.exports = {
   Article: { create: createArticle, fromRaw: articleFromRaw },
  Summary,
  AudioAsset,
  UserEvent,
  UserSettings,
};
