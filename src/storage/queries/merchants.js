import { query, run } from '../db.js';

export function listMerchantNames(db) {
  return query(db, 'SELECT name FROM merchants ORDER BY last_seen DESC').map((r) => r.name);
}

// Pick-or-add: reuses an existing merchant by exact name match, otherwise
// creates one. Keeps totals reliable (docs/DATA_MODEL.md's Merchants section).
export function upsertMerchant(db, name, dateStr) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const existing = query(db, 'SELECT id FROM merchants WHERE name = ?', [trimmed])[0];
  if (existing) {
    run(db, 'UPDATE merchants SET last_seen = ? WHERE id = ?', [dateStr, existing.id]);
    return existing.id;
  }
  return run(db, 'INSERT INTO merchants (name, first_seen, last_seen) VALUES (?, ?, ?)', [trimmed, dateStr, dateStr]);
}
