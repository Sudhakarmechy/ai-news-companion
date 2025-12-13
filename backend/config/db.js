// backend/config/db.js
require('dotenv').config();

/**
 * DB_PROVIDER can be:
 *   - 'json'      → use JSON file storage (dev / current mode)
 *   - 'postgres'  → use PostgreSQL (future production mode)
 */
const DB_PROVIDER = process.env.DB_PROVIDER || 'json';

const POSTGRES_URL = process.env.POSTGRES_URL || '';

module.exports = {
  DB_PROVIDER,
  POSTGRES_URL,
};
