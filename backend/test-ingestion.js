require('dotenv').config();

const { ingestGoogleNews } = require('./services/ingestion/ingestGoogleNews');

(async () => {
  try {
    const count = await ingestGoogleNews({ country: 'IN', language: 'en' });
    console.log('✅ Ingestion completed, count:', count);
  } catch (err) {
    console.error('❌ Ingestion failed:', err.message);
  }
})();
