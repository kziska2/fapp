import { query, run } from '../db.js';

export function listCategories(db) {
  return query(db, 'SELECT * FROM categories ORDER BY sort_order');
}

export function addCategory(db, { label, type }) {
  const maxOrder = query(db, 'SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories')[0].m;
  const id = run(db, 'INSERT INTO categories (label, type, sort_order) VALUES (?, ?, ?)', [label, type, maxOrder + 1]);
  run(db, 'INSERT OR IGNORE INTO budget_lines (category_id, amount_monthly) VALUES (?, 0)', [id]);
  return id;
}

// Categories can be removed even if they have existing transactions or a
// budget line, per the "get rid of any category" decision — old transactions
// simply keep their (now-orphaned) category_id rather than being deleted too.
export function deleteCategory(db, id) {
  run(db, 'DELETE FROM budget_lines WHERE category_id = ?', [id]);
  run(db, 'DELETE FROM categories WHERE id = ?', [id]);
}

export function renameCategory(db, id, label) {
  run(db, 'UPDATE categories SET label = ? WHERE id = ?', [label, id]);
}

export function retypeCategory(db, id, type) {
  run(db, 'UPDATE categories SET type = ? WHERE id = ?', [type, id]);
}
