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

export function periodRange(period) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { start: toStr(start), end: toStr(now) };
  }
  if (period === 'year') {
    return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toStr(start), end: toStr(end) };
}

export function scaleMonthly(monthlyAmount, period) {
  if (period === 'week') return monthlyAmount / 4.3;
  if (period === 'year') return monthlyAmount * 12;
  return monthlyAmount;
}
