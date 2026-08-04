import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listBudgetLines } from '../storage/queries/budget.js';
import { spendByCategoryForRange, incomeForRange, recentExpenses } from '../storage/queries/transactions.js';
import { investmentTotalsByType } from '../storage/queries/investments.js';
import { searchIndex, vendorDetail, categoryDetail, noteDetail } from '../storage/queries/search.js';
import { categoryColor } from '../components/categoryColors.js';
import Ring from '../components/Ring.jsx';
import TxRow from '../components/TxRow.jsx';
import { fmt, fmtCents, periodRange, periodLabel, scaleMonthly } from '../utils/format.js';

const SAVINGS_INVESTMENT_TYPES = ['Retirement (401k/IRA)', 'Short-term savings', 'Big-purchase savings'];
const ALL_TIME_RANGE = { start: '0000-01-01', end: '9999-12-31' };

function SearchBox({ db }) {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult] = useState(null);

  const onChange = (v) => {
    setTerm(v);
    setResult(null);
    setSuggestions(v.trim() ? searchIndex(db, v.trim()) : []);
  };

  const pick = (s) => {
    setTerm(s.label);
    setSuggestions([]);
    if (s.kind === 'vendor') setResult(vendorDetail(db, s.label));
    else if (s.kind === 'category') setResult(categoryDetail(db, s.label));
    else setResult(noteDetail(db, s.label));
  };

  return (
    <div className="searchbox">
      <div className="row">
        <input
          type="text"
          placeholder="Vendor, category, or a word from a note…"
          value={term}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="suggest show">
          {suggestions.map((s, i) => (
            <button key={i} className="opt" type="button" onClick={() => pick(s)}>
              <span className={`kind kind-${s.kind}`}>{s.kind}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
      {result && (
        <div className="result-card">
          <div className="rtitle">
            <span className={`kind kind-${result.kind}`} style={{ fontSize: 9 }}>{result.kind}</span> {result.title}
          </div>
          <div className="rstats">
            {result.kind === 'vendor' && (
              <>
                <div>All-time<b>{fmt(result.allTime)}</b></div>
                <div>This year<b>{fmt(result.thisYear)}</b></div>
                <div>This month<b>{fmt(result.thisMonth)}</b></div>
              </>
            )}
            {result.kind === 'category' && (
              <>
                <div>This month<b>{fmt(result.thisMonth)}</b></div>
                <div>This year<b>{fmt(result.thisYear)}</b></div>
                {result.pctOfBudget !== null && <div>% of budget<b>{result.pctOfBudget}%</b></div>}
              </>
            )}
            {result.kind === 'note' && <div>Total<b>{fmt(result.total)}</b></div>}
          </div>
          <div className="result-list">
            {result.rows.map((r) => (
              <div key={r.id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-tertiary)' }}>
                {r.date} · {fmtCents(r.amount)}
              </div>
            ))}
            {result.rows.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No purchases found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Summary() {
  const { db, notifyChanged, version } = useVault();
  const [period, setPeriod] = useState('month');
  const [offset, setOffset] = useState(0);

  // Switching Week/Month/Year jumps back to "now" for that granularity —
  // carrying an arbitrary offset across different period types (e.g. "3
  // months back" staying applied after switching to Week) would be confusing.
  const changePeriod = (p) => { setPeriod(p); setOffset(0); };

  const budgetLines = useMemo(() => listBudgetLines(db), [db, version]);
  const range = periodRange(period, offset);
  const isCurrent = offset === 0;
  const periodPhrase = isCurrent ? `this ${period}` : periodLabel(period, offset);

  const spendByCat = useMemo(() => spendByCategoryForRange(db, range.start, range.end), [db, version, range.start, range.end]);
  const earned = useMemo(() => incomeForRange(db, range.start, range.end), [db, version, range.start, range.end]);
  const investedByType = useMemo(() => investmentTotalsByType(db, range.start, range.end), [db, version, range.start, range.end]);
  const investedAllTimeByType = useMemo(() => investmentTotalsByType(db, ALL_TIME_RANGE.start, ALL_TIME_RANGE.end), [db, version]);
  const recent = useMemo(() => recentExpenses(db, 3), [db, version]);

  const spendableLines = budgetLines.filter((l) => l.type !== 'savings');
  const totalBudget = scaleMonthly(spendableLines.reduce((s, l) => s + l.amount_monthly, 0), period);
  const totalSpent = Object.values(spendByCat).reduce((s, v) => s + v, 0);
  const over = totalBudget > 0 && totalSpent > totalBudget;
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;

  const categoryCells = spendableLines
    .map((l) => ({ ...l, spent: spendByCat[l.category_id] || 0, budget: scaleMonthly(l.amount_monthly, period) }))
    .filter((l) => l.spent > 0 || l.budget > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  const savingsGoal = scaleMonthly(budgetLines.filter((l) => l.type === 'savings').reduce((s, l) => s + l.amount_monthly, 0), period);
  const invested = SAVINGS_INVESTMENT_TYPES.reduce((s, t) => s + (investedByType[t] || 0), 0);
  const investedPct = savingsGoal > 0 ? Math.min((invested / savingsGoal) * 100, 100) : 0;
  const allTimeInvested = SAVINGS_INVESTMENT_TYPES.reduce((s, t) => s + (investedAllTimeByType[t] || 0), 0);

  return (
    <div>
      <SearchBox db={db} />

      <div className="foldertabs" style={{ marginTop: 10 }}>
        {['week', 'month', 'year'].map((p) => (
          <button key={p} className={`foldertab ${period === p ? 'active' : ''}`} type="button" onClick={() => changePeriod(p)}>
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div className="folderbody">
        <div className="period-nav">
          <button type="button" className="period-nav-btn" onClick={() => setOffset((o) => o - 1)} aria-label={`Previous ${period}`}>‹</button>
          <span className="period-nav-label">{isCurrent ? `This ${period}` : periodLabel(period, offset)}</span>
          <button type="button" className="period-nav-btn" onClick={() => setOffset((o) => o + 1)} aria-label={`Next ${period}`}>›</button>
        </div>
        {!isCurrent && (
          <button type="button" className="period-nav-today" onClick={() => setOffset(0)}>Back to today</button>
        )}
        <div className="section-title" style={{ marginTop: 0 }}>Budget — {periodPhrase}</div>
        <div className="ring-center">
          <Ring pct={pct} ringColor={over ? 'var(--accent-expense)' : 'var(--accent-necessary)'} value={fmt(totalSpent)} sub={`of ${fmt(totalBudget)}`} />
          <div className="statline">
            <span><span className="lbl">Used</span><span className="val">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</span></span>
            <span><span className="lbl">Remaining</span><span className={`val ${remaining >= 0 ? 'pos' : 'neg'}`}>{fmt(remaining)}</span></span>
          </div>
        </div>
        {period === 'week' && (
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 5, lineHeight: 1.4, textAlign: 'center' }}>
            Most weeks default to a quarter of your monthly budget — but you can set a custom budget for a
            specific date range (like a trip) on the Budget tab.
          </p>
        )}

        <div className="section-title">Expenses by category</div>
        {categoryCells.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No expense data for this period.</p>
        )}
        {categoryCells.length > 0 && (
          <div className="ring-grid">
            {categoryCells.map((c) => {
              const catOver = c.budget > 0 && c.spent > c.budget;
              const cpct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 100;
              return (
                <div className="ring-cell" key={c.category_id}>
                  <Ring
                    variant="sm"
                    pct={cpct}
                    ringColor={catOver ? 'var(--accent-expense)' : categoryColor(c.label, c.type)}
                    value={fmt(c.spent)}
                    sub={c.budget > 0 ? `of ${fmt(c.budget)}` : ''}
                  />
                  <div className="clabel">{c.label}</div>
                  <div className="cpct">{c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : '—'}%</div>
                  {catOver && <div className="over-tag">+{fmt(c.spent - c.budget)} over</div>}
                </div>
              );
            })}
          </div>
        )}

        <div className="goal-pair">
          <div className="goal-cell">
            <div className="section-title">Earned {periodPhrase}</div>
            <div className="plain-stat">
              <div className="pv">{fmt(earned)}</div>
              <div className="pl">real, logged income</div>
            </div>
          </div>
          <div className="goal-cell">
            <div className="section-title">Invested {periodPhrase}</div>
            <Ring pct={investedPct} ringColor="var(--accent-purple)" value={fmt(invested)} sub={`of ${fmt(savingsGoal)}`} />
            <div className="goal-pct">{savingsGoal > 0 ? Math.round(investedPct) : 0}% to goal</div>
          </div>
        </div>
        <div className="goal-caption">
          Savings goal is set on the Budget tab. All-time contributed: <b style={{ color: 'var(--text-primary)' }}>{fmt(allTimeInvested)}</b>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 12 }}>Last three purchases</div>
      {recent.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No purchases logged yet.</p>}
      {recent.map((tx) => (
        <TxRow key={tx.id} tx={tx} />
      ))}
    </div>
  );
}
