const { generateDigest } = require('./services/digest/digestEngine');

(async () => {
  const digest = await generateDigest({
    type: 'trending',
    language: 'en',
    limit: 5
  });

  console.log('Generated digest:', digest);
})();
