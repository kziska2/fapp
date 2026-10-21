import { listCategories } from '../storage/queries/categories.js';
import { spendByCategoryForRange, incomeByJobForRange, transactionsForRange } from '../storage/queries/transactions.js';
import { investmentsForRange } from '../storage/queries/investments.js';
import { categoryColor } from '../components/categoryColors.js';

function daysBetweenInclusive(start, end) {
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// Shared by the in-app preview and the .xlsx export so the two can never
// disagree — plain numbers only, no currency formatting (that's each
// renderer's job).
function withAverages(rows, total, days, weeks, months) {
  return rows.map((r) => ({
    ...r,
    pct: total > 0 ? Math.round((r.total / total) * 100) : 0,
    avgDay: r.total / days,
    avgWeek: r.total / weeks,
    avgMonth: r.total / months,
  }));
}

// `start`/`end` are inclusive YYYY-MM-DD bounds — the caller (Summary.jsx)
// resolves presets/custom dates/"all time" down to this shape first.
export function buildSummaryReport(db, { start, end }) {
  const days = daysBetweenInclusive(start, end);
  const weeks = days / 7;
  const months = days / 30.44; // average month length — keeps "all time" and custom ranges sane, not just calendar months

  const categories = listCategories(db).filter((c) => c.type !== 'savings');
  const spendByCat = spendByCategoryForRange(db, start, end);
  const categoryTotals = categories
    .map((c) => ({ categoryId: c.id, label: c.label, color: categoryColor(c.label, c.type), total: spendByCat[c.id] || 0 }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const incomeTotals = incomeByJobForRange(db, start, end)
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalSpending = categoryTotals.reduce((s, c) => s + c.total, 0);
  const totalIncome = incomeTotals.reduce((s, r) => s + r.total, 0);

  const categoryRows = withAverages(categoryTotals, totalSpending, days, weeks, months);
  const incomeRows = withAverages(incomeTotals, totalIncome, days, weeks, months);

  const chartMax = Math.max(0, ...categoryRows.map((c) => c.total), ...incomeRows.map((r) => r.total));
  const chartRows = [
    ...incomeRows.map((r) => ({ label: r.label, total: r.total, color: 'var(--accent-income)', kind: 'income' })),
    ...categoryRows.map((c) => ({ label: c.label, total: c.total, color: c.color, kind: 'expense' })),
  ]
    .sort((a, b) => b.total - a.total)
    .map((r) => ({ ...r, pctOfMax: chartMax > 0 ? Math.max(3, Math.round((r.total / chartMax) * 100)) : 0 }));

  // Every daily entry in range, chronological, for the downloadable listing —
  // expenses and paychecks from transactions, plus investment contributions,
  // the same three kinds Summary's Activity record already combines.
  const txs = transactionsForRange(db, start, end).map((t) => ({ ...t, _key: `tx-${t.id}` }));
  const invests = investmentsForRange(db, start, end).map((inv) => ({
    ...inv,
    _key: `inv-${inv.id}`,
    type: 'investment',
    amount: inv.shares * inv.cost_per_share,
  }));
  const entries = [...txs, ...invests].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  return {
    start,
    end,
    days,
    weeks,
    months,
    totalSpending,
    totalIncome,
    net: totalIncome - totalSpending,
    categoryRows,
    incomeRows,
    chartRows,
    entries,
  };
}
