/**
 * Re-export database utilities from db/index.js
 * Retained for backwards compatibility across existing imports.
 */
export {
  db,
  getDbClient,
  queryAll,
  queryGet,
  execute,
  initializeDB
} from './index.js';
