import { query } from '../db.js';

// Simple single-box search (docs/SUMMARY_AND_SEARCH.md): a typed term checks
// vendor names, category names, and note text at once, up to a few of each.
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
  return [...vendors, ...categories, ...notes];
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
