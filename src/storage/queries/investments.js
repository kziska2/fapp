import { query, run } from '../db.js';

export function listInvestments(db) {
  return query(db, 'SELECT * FROM investments ORDER BY date DESC, id DESC');
}

export function addInvestment(db, { date, ticker, shares, costPerShare, accountType, investmentType, note }) {
  return run(
    db,
    `INSERT INTO investments (date, ticker, shares, cost_per_share, account_type, investment_type, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [date, ticker, shares, costPerShare, accountType, investmentType, note || null]
  );
}

export function deleteInvestment(db, id) {
  run(db, 'DELETE FROM investments WHERE id = ?', [id]);
}

// Cost basis only (money in) — no market-value tracking, per docs/DATA_MODEL.md.
export function investmentTotalsByType(db, startDate, endDate) {
  const rows = query(
    db,
    `SELECT investment_type, COALESCE(SUM(shares * cost_per_share), 0) AS total
     FROM investments WHERE date >= ? AND date <= ? GROUP BY investment_type`,
    [startDate, endDate]
  );
  const map = {};
  rows.forEach((r) => { map[r.investment_type] = r.total; });
  return map;
}

export function investmentAllTimeTotal(db) {
  return query(db, 'SELECT COALESCE(SUM(shares * cost_per_share), 0) AS total FROM investments')[0].total;
}
