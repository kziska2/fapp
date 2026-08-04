import { query, run } from '../db.js';

const RETIREMENT_KEY = 'retirement_settings';

export function getRetirementSettings(db) {
  const row = query(db, 'SELECT value FROM app_settings WHERE key = ?', [RETIREMENT_KEY])[0];
  return row ? JSON.parse(row.value) : null;
}

export function saveRetirementSettings(db, cfg) {
  run(
    db,
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [RETIREMENT_KEY, JSON.stringify(cfg)]
  );
}
