import { query, run } from '../db.js';

export function listBudgetLines(db) {
  return query(
    db,
    `SELECT c.id AS category_id, c.label, c.type, c.sort_order, COALESCE(b.amount_monthly, 0) AS amount_monthly
     FROM categories c
     LEFT JOIN budget_lines b ON b.category_id = c.id
     ORDER BY c.sort_order`
  );
}

export function setBudgetAmount(db, categoryId, amount) {
  run(
    db,
    `INSERT INTO budget_lines (category_id, amount_monthly) VALUES (?, ?)
     ON CONFLICT(category_id) DO UPDATE SET amount_monthly = excluded.amount_monthly`,
    [categoryId, amount]
  );
}

export function listExceptionalPeriods(db) {
  return query(db, 'SELECT * FROM exceptional_periods ORDER BY start_date');
}

export function addExceptionalPeriod(db, { startDate, endDate, name, amount }) {
  return run(
    db,
    'INSERT INTO exceptional_periods (start_date, end_date, name, amount) VALUES (?, ?, ?, ?)',
    [startDate, endDate, name || null, amount]
  );
}

export function updateExceptionalPeriod(db, id, { startDate, endDate, name, amount }) {
  run(
    db,
    'UPDATE exceptional_periods SET start_date = ?, end_date = ?, name = ?, amount = ? WHERE id = ?',
    [startDate, endDate, name || null, amount, id]
  );
}

export function deleteExceptionalPeriod(db, id) {
  run(db, 'DELETE FROM exceptional_periods WHERE id = ?', [id]);
}

// The Budget tab's income line: defaults to real logged income and can only
// be set *below* it (never above) — see docs/BUDGET.md's income section.
// Null means "use the real figure, no manual override."
export function getIncomeOverride(db) {
  const row = query(db, "SELECT value FROM app_settings WHERE key = 'income_override'")[0];
  return row && row.value !== null ? Number(row.value) : null;
}

export function setIncomeOverride(db, amount) {
  run(
    db,
    `INSERT INTO app_settings (key, value) VALUES ('income_override', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [amount === null ? null : String(amount)]
  );
}
