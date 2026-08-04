import { query, run } from '../db.js';

export function listJobNames(db) {
  return query(db, 'SELECT name FROM jobs ORDER BY last_seen DESC').map((r) => r.name);
}

// Pick-or-add, parallel to merchants.js but for income sources.
export function upsertJob(db, name, dateStr) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const existing = query(db, 'SELECT id FROM jobs WHERE name = ?', [trimmed])[0];
  if (existing) {
    run(db, 'UPDATE jobs SET last_seen = ? WHERE id = ?', [dateStr, existing.id]);
    return existing.id;
  }
  return run(db, 'INSERT INTO jobs (name, first_seen, last_seen) VALUES (?, ?, ?)', [trimmed, dateStr, dateStr]);
}
