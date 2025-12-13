// backend/providers/llm/stubProvider.js
// Temporary stub so code doesn't crash before we implement real providers.

async function summarizeArticle(article, options = {}) {
  throw new Error('LLM summarizeArticle not implemented yet (stubProvider).');
}

async function answerQuestion(context, question, options = {}) {
  throw new Error('LLM answerQuestion not implemented yet (stubProvider).');
}

// backend/providers/tts/stubProvider.js
async function synthesizeSpeech(text, options = {}) {
  throw new Error('TTS synthesizeSpeech not implemented yet (stubProvider).');
}


module.exports = {
  summarizeArticle,
  answerQuestion,
  synthesizeSpeech,
};
