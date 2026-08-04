import { query, run } from '../db.js';
import { upsertMerchant } from './merchants.js';
import { upsertJob } from './jobs.js';

export function addExpense(db, { date, amount, categoryId, necessary, merchantName, note }) {
  const merchantId = merchantName ? upsertMerchant(db, merchantName, date) : null;
  return run(
    db,
    `INSERT INTO transactions (date, type, amount, category_id, merchant_id, necessary, note)
     VALUES (?, 'expense', ?, ?, ?, ?, ?)`,
    [date, amount, categoryId, merchantId, necessary, note || null]
  );
}

// Every income entry is a real, already-landed deposit — no expected/projected
// income field anywhere (docs/DAILY_LOG.md).
export function addIncome(db, { date, amount, jobName, note }) {
  const jobId = upsertJob(db, jobName, date);
  return run(
    db,
    `INSERT INTO transactions (date, type, amount, job_id, note) VALUES (?, 'income', ?, ?, ?)`,
    [date, amount, jobId, note || null]
  );
}

export function deleteTransaction(db, id) {
  run(db, 'DELETE FROM transactions WHERE id = ?', [id]);
}

export function listTransactionsForMonth(db, yyyymm) {
  return query(
    db,
    `SELECT t.*, c.label AS category_label, c.type AS category_type,
            m.name AS merchant_name, j.name AS job_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN merchants m ON m.id = t.merchant_id
     LEFT JOIN jobs j ON j.id = t.job_id
     WHERE substr(t.date, 1, 7) = ?
     ORDER BY t.date DESC, t.id DESC`,
    [yyyymm]
  );
}

export function monthTotals(db, yyyymm) {
  const rows = query(
    db,
    `SELECT type, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE substr(date, 1, 7) = ? GROUP BY type`,
    [yyyymm]
  );
  return {
    income: rows.find((r) => r.type === 'income')?.total || 0,
    expense: rows.find((r) => r.type === 'expense')?.total || 0,
  };
}

// Used by both the Budget tab's spend-down tracker and Summary's category ring
// grid — a plain sum per category over an inclusive date range.
export function spendByCategoryForRange(db, startDate, endDate) {
  const rows = query(
    db,
    `SELECT category_id, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ?
     GROUP BY category_id`,
    [startDate, endDate]
  );
  const map = {};
  rows.forEach((r) => { map[r.category_id] = r.total; });
  return map;
}

export function incomeForRange(db, startDate, endDate) {
  return query(
    db,
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'income' AND date >= ? AND date <= ?`,
    [startDate, endDate]
  )[0].total;
}

// Summary's purchase-record list — every expense in the selected period
// (whatever week/month/year the period nav is on), newest first.
export function expensesForRange(db, startDate, endDate) {
  return query(
    db,
    `SELECT t.*, c.label AS category_label, c.type AS category_type, m.name AS merchant_name
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     LEFT JOIN merchants m ON m.id = t.merchant_id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     ORDER BY t.date DESC, t.id DESC`,
    [startDate, endDate]
  );
}
