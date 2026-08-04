import { query, run } from '../db.js';

// Simple single-box search (docs/SUMMARY_AND_SEARCH.md): a typed term checks
// vendor names, category names, note text, and the necessary/discretionary
// types at once, up to a few of each.
export function searchIndex(db, term) {
  const t = `%${term}%`;
  const vendors = query(db, 'SELECT DISTINCT name FROM merchants WHERE name LIKE ? LIMIT 5', [t])
    .map((r) => ({ kind: 'vendor', label: r.name }));
  const categories = query(db, 'SELECT DISTINCT label FROM categories WHERE label LIKE ? LIMIT 5', [t])
    .map((r) => ({ kind: 'category', label: r.label }));
  const notes = query(
    db,
    "SELECT DISTINCT note FROM transactions WHERE note LIKE ? AND note IS NOT NULL AND note != '' LIMIT 5",
    [t]
  ).map((r) => ({ kind: 'note', label: r.note }));
  const types = ['necessary', 'discretionary']
    .filter((ty) => ty.includes(term.toLowerCase()))
    .map((ty) => ({ kind: 'type', label: ty[0].toUpperCase() + ty.slice(1) }));
  return [...vendors, ...categories, ...types, ...notes];
}

export function vendorDetail(db, name) {
  const rows = query(
    db,
    `SELECT t.* FROM transactions t
     JOIN merchants m ON m.id = t.merchant_id
     WHERE m.name = ? ORDER BY t.date DESC`,
    [name]
  );
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const thisYear = rows.filter((r) => r.date.slice(0, 4) === new Date().getFullYear().toString());
  const thisMonth = rows.filter((r) => r.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  return {
    kind: 'vendor',
    title: name,
    allTime: total,
    thisYear: thisYear.reduce((s, r) => s + r.amount, 0),
    thisMonth: thisMonth.reduce((s, r) => s + r.amount, 0),
    lastPurchase: rows[0]?.date || null,
    rows,
  };
}

export function categoryDetail(db, label) {
  const rows = query(
    db,
    `SELECT t.* FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE c.label = ? AND t.type = 'expense' ORDER BY t.date DESC`,
    [label]
  );
  const thisYear = rows.filter((r) => r.date.slice(0, 4) === new Date().getFullYear().toString());
  const thisMonth = rows.filter((r) => r.date.slice(0, 7) === new Date().toISOString().slice(0, 7));
  const budgetRow = query(
    db,
    `SELECT COALESCE(b.amount_monthly, 0) AS amount_monthly
     FROM categories c LEFT JOIN budget_lines b ON b.category_id = c.id WHERE c.label = ?`,
    [label]
  )[0];
  const budget = budgetRow?.amount_monthly || 0;
  const spentThisMonth = thisMonth.reduce((s, r) => s + r.amount, 0);
  return {
    kind: 'category',
    title: label,
    thisMonth: spentThisMonth,
    thisYear: thisYear.reduce((s, r) => s + r.amount, 0),
    budget,
    pctOfBudget: budget > 0 ? Math.round((spentThisMonth / budget) * 100) : null,
    rows,
  };
}

export function noteDetail(db, note) {
  const rows = query(db, `SELECT * FROM transactions WHERE note = ? ORDER BY date DESC`, [note]);
  return { kind: 'note', title: `"${note}"`, total: rows.reduce((s, r) => s + r.amount, 0), rows };
}

export function typeDetail(db, label) {
  const type = label.toLowerCase();
  const year = new Date().getFullYear().toString();
  const thisMonthYm = new Date().toISOString().slice(0, 7);
  const rows = query(
    db,
    `SELECT t.*, c.label AS category_label, m.name AS merchant_name FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN merchants m ON m.id = t.merchant_id
     WHERE t.type = 'expense' AND t.necessary = ? AND substr(t.date, 1, 4) = ?
     ORDER BY t.date DESC`,
    [type, year]
  );
  const thisMonth = rows.filter((r) => r.date.slice(0, 7) === thisMonthYm);
  const spentThisMonth = thisMonth.reduce((s, r) => s + r.amount, 0);
  const typeBudget = query(
    db,
    `SELECT COALESCE(SUM(b.amount_monthly), 0) AS total FROM categories c
     LEFT JOIN budget_lines b ON b.category_id = c.id WHERE c.type = ?`,
    [type]
  )[0].total;
  const totalBudget = query(
    db,
    `SELECT COALESCE(SUM(b.amount_monthly), 0) AS total FROM categories c
     LEFT JOIN budget_lines b ON b.category_id = c.id WHERE c.type IN ('necessary', 'discretionary')`
  )[0].total;
  return {
    kind: 'type',
    title: label,
    thisMonth: spentThisMonth,
    thisYear: rows.reduce((s, r) => s + r.amount, 0),
    pctOfBudgetIsType: totalBudget > 0 ? Math.round((typeBudget / totalBudget) * 100) : null,
    pctOfTypeSpent: typeBudget > 0 ? Math.round((spentThisMonth / typeBudget) * 100) : null,
    rows,
  };
}

// Advanced search (docs/SUMMARY_AND_SEARCH.md): combine any subset of filters,
// ignoring whichever are left blank. Expense-only, since category/type/vendor
// only apply to expenses.
export function advancedSearch(db, filters) {
  const clauses = ["t.type = 'expense'"];
  const params = [];
  if (filters.startDate) { clauses.push('t.date >= ?'); params.push(filters.startDate); }
  if (filters.endDate) { clauses.push('t.date <= ?'); params.push(filters.endDate); }
  if (filters.minAmount !== '' && filters.minAmount != null) { clauses.push('t.amount >= ?'); params.push(Number(filters.minAmount)); }
  if (filters.maxAmount !== '' && filters.maxAmount != null) { clauses.push('t.amount <= ?'); params.push(Number(filters.maxAmount)); }
  if (filters.categoryId) { clauses.push('t.category_id = ?'); params.push(Number(filters.categoryId)); }
  if (filters.necessary) { clauses.push('t.necessary = ?'); params.push(filters.necessary); }
  if (filters.merchantName) { clauses.push('m.name = ?'); params.push(filters.merchantName); }
  if (filters.noteTerm) { clauses.push('t.note LIKE ?'); params.push(`%${filters.noteTerm}%`); }

  const rows = query(
    db,
    `SELECT t.*, c.label AS category_label, c.type AS category_type, m.name AS merchant_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN merchants m ON m.id = t.merchant_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY t.date DESC, t.id DESC`,
    params
  );
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

export function listSavedSearches(db) {
  return query(db, 'SELECT * FROM saved_searches ORDER BY id DESC').map((r) => ({ ...r, filters: JSON.parse(r.filters) }));
}

export function saveSearch(db, name, filters) {
  return run(db, 'INSERT INTO saved_searches (name, filters) VALUES (?, ?)', [name, JSON.stringify(filters)]);
}

export function deleteSavedSearch(db, id) {
  run(db, 'DELETE FROM saved_searches WHERE id = ?', [id]);
}
