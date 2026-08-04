export function fmt(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.round(Math.abs(v)).toLocaleString('en-US');
}

export function fmtCents(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function fmtShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// `offset` shifts the range by whole periods — -1 is the previous week/month/
// year, +1 the next — so Summary can page back through history or ahead into
// a future month, not just show "now."
export function periodRange(period, offset = 0) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (period === 'week') {
    const end = new Date(now);
    end.setDate(end.getDate() + offset * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { start: toStr(start), end: toStr(end) };
  }
  if (period === 'year') {
    const year = now.getFullYear() + offset;
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start: toStr(start), end: toStr(end) };
}

// A short human label for the currently selected span, e.g. "Jul 2026",
// "2025", or "Jul 28 – Aug 3" — used when offset !== 0 so the header doesn't
// keep saying "this month" while showing a different one.
export function periodLabel(period, offset) {
  const { start, end } = periodRange(period, offset);
  if (period === 'year') return start.slice(0, 4);
  if (period === 'month') {
    const d = new Date(start + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return `${fmtShortDate(start)} – ${fmtShortDate(end)}`;
}

// The `n` calendar months strictly before the current one, oldest first — used
// to average income over a trailing window that excludes the current
// (possibly still-partial) month.
export function previousYearMonths(n) {
  const now = new Date();
  const months = [];
  for (let i = n; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export function scaleMonthly(monthlyAmount, period) {
  if (period === 'week') return monthlyAmount / 4.3;
  if (period === 'year') return monthlyAmount * 12;
  return monthlyAmount;
}
