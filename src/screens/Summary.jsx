import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listBudgetLines } from '../storage/queries/budget.js';
import { spendByCategoryForRange, incomeForRange, transactionsForRange, transactionDateBounds } from '../storage/queries/transactions.js';
import { investmentTotalsByType, investmentsForRange } from '../storage/queries/investments.js';
import { searchIndex, vendorDetail, categoryDetail, noteDetail, typeDetail } from '../storage/queries/search.js';
import { categoryColor } from '../components/categoryColors.js';
import { buildSummaryReport } from '../utils/summaryReport.js';
import { downloadSummaryXlsx } from '../utils/xlsxExport.js';
import Ring from '../components/Ring.jsx';
import TxRow from '../components/TxRow.jsx';
import AdvancedSearch from '../components/AdvancedSearch.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import { fmt, fmtCents, fmtShortDate, periodRange, periodLabel, scaleMonthly, todayStr } from '../utils/format.js';

const SAVINGS_INVESTMENT_TYPES = ['Retirement (401k/IRA)', 'Short-term savings', 'Big-purchase savings'];
const ALL_TIME_RANGE = { start: '0000-01-01', end: '9999-12-31' };
const REPORT_PRESETS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

function resolveReportRange(db, preset, customStart, customEnd) {
  if (preset === 'week') return periodRange('week', 0);
  if (preset === 'month') return periodRange('month', 0);
  if (preset === 'year') return periodRange('year', 0);
  if (preset === 'all') {
    const bounds = transactionDateBounds(db);
    return { start: bounds.minDate || todayStr(), end: bounds.maxDate || todayStr() };
  }
  return { start: customStart, end: customEnd };
}

function reportRangeLabel(preset, range) {
  if (preset === 'week') return `This week (${fmtShortDate(range.start)} – ${fmtShortDate(range.end)})`;
  if (preset === 'month') return periodLabel('month', 0);
  if (preset === 'year') return periodLabel('year', 0);
  if (preset === 'all') return `All time (${fmtShortDate(range.start)} – ${fmtShortDate(range.end)})`;
  return `${fmtShortDate(range.start)} – ${fmtShortDate(range.end)}`;
}

// A time frame + spreadsheet-style breakdown of spending/income, separate
// from the period nav above (which only drives the budget ring and category
// rings) — this needs "all time" and a custom range, which that doesn't support.
function SpendingReport({ db }) {
  const [view, setView] = useState('idle'); // idle | timeframe | result
  const [preset, setPreset] = useState('month');
  const [customStart, setCustomStart] = useState(() => periodRange('month', 0).start);
  const [customEnd, setCustomEnd] = useState(() => periodRange('month', 0).end);
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const generate = () => {
    const range = resolveReportRange(db, preset, customStart, customEnd);
    setReport({ ...buildSummaryReport(db, range), label: reportRangeLabel(preset, range) });
    setView('result');
  };

  const download = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      await downloadSummaryXlsx(report, { rangeLabel: report.label });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="scard">
      {view === 'idle' && (
        <>
          <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Pick a time frame and get a spreadsheet-style breakdown of your spending and income, plus a chart
            comparing categories and sources.
          </p>
          <button
            type="button"
            className="addbtn"
            style={{ background: 'var(--accent-purple)', color: 'var(--accent-purple-bg)' }}
            onClick={() => setView('timeframe')}
          >
            Generate summary
          </button>
        </>
      )}

      {view === 'timeframe' && (
        <>
          <p style={{ fontSize: 11, fontWeight: 650, color: 'var(--text-secondary)', margin: '0 0 8px' }}>Choose a time frame</p>
          <div className="preset-row">
            {REPORT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`preset-btn ${preset === p.id ? 'active' : ''}`}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="grid2" style={{ marginBottom: 12 }}>
              <div className="field">
                <label>Start date</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              </div>
              <div className="field">
                <label>End date</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
            </div>
          )}
          <div className="modal-actions" style={{ marginTop: 4 }}>
            <button type="button" className="modal-cancel" onClick={() => setView('idle')}>Cancel</button>
            <button
              type="button"
              className="addbtn"
              style={{ background: 'var(--accent-purple)', color: 'var(--accent-purple-bg)' }}
              onClick={generate}
            >
              Generate
            </button>
          </div>
        </>
      )}

      {view === 'result' && report && (
        <>
          <div className="report-range-row">
            <div className="rlabel">{report.label}</div>
            <button type="button" className="reset-link" onClick={() => setView('timeframe')}>Change range</button>
          </div>

          <button type="button" className="report-download-btn" onClick={download} disabled={downloading}>
            {downloading ? 'Preparing file…' : '↓ Download as spreadsheet'}
          </button>
          <p className="report-download-hint">Every entry in this range, organized by date, plus the summary tables below — as one file.</p>

          <div className="section-title" style={{ marginTop: 10 }}>Overview</div>
          <div className="rtable-wrap">
            <table className="rtable">
              <thead>
                <tr><th>Metric</th><th>Spending</th><th>Income</th><th>Net</th></tr>
              </thead>
              <tbody>
                {[
                  ['Total', report.totalSpending, report.totalIncome, report.net],
                  ['Avg / day', report.totalSpending / report.days, report.totalIncome / report.days, report.net / report.days],
                  ['Avg / week', report.totalSpending / report.weeks, report.totalIncome / report.weeks, report.net / report.weeks],
                  ['Avg / month', report.totalSpending / report.months, report.totalIncome / report.months, report.net / report.months],
                ].map(([label, spend, income, net]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td style={{ color: 'var(--accent-expense)' }}>{fmtCents(spend)}</td>
                    <td style={{ color: 'var(--accent-income)' }}>{fmtCents(income)}</td>
                    <td style={{ color: net >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)', fontWeight: 700 }}>
                      {net >= 0 ? '+' : '−'}{fmtCents(Math.abs(net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-title">Spending by category</div>
          {report.categoryRows.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No expenses in this range.</p>}
          {report.categoryRows.length > 0 && (
            <div className="rtable-wrap">
              <table className="rtable" style={{ minWidth: 460 }}>
                <thead>
                  <tr><th>Category</th><th>Avg / month</th><th>% of spend</th><th>Avg / week</th><th>Avg / day</th></tr>
                </thead>
                <tbody>
                  {report.categoryRows.map((c) => (
                    <tr key={c.categoryId}>
                      <td><span className="dot" style={{ background: c.color }} />{c.label}</td>
                      <td>{fmtCents(c.avgMonth)}</td>
                      <td>{c.pct}%</td>
                      <td>{fmtCents(c.avgWeek)}</td>
                      <td>{fmtCents(c.avgDay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="section-title">Income by source</div>
          {report.incomeRows.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No income in this range.</p>}
          {report.incomeRows.length > 0 && (
            <div className="rtable-wrap">
              <table className="rtable" style={{ minWidth: 460 }}>
                <thead>
                  <tr><th>Source</th><th>Avg / month</th><th>% of income</th><th>Avg / week</th><th>Avg / day</th></tr>
                </thead>
                <tbody>
                  {report.incomeRows.map((r) => (
                    <tr key={r.jobId ?? r.label}>
                      <td><span className="dot" style={{ background: 'var(--accent-income)' }} />{r.label}</td>
                      <td>{fmtCents(r.avgMonth)}</td>
                      <td>{r.pct}%</td>
                      <td>{fmtCents(r.avgWeek)}</td>
                      <td>{fmtCents(r.avgDay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="report-range-row" style={{ marginTop: 14, marginBottom: 4 }}>
            <div className="section-title" style={{ margin: 0 }}>By category &amp; source</div>
            <div className="chart-legend">
              <span><span className="dot" style={{ background: 'var(--accent-income)' }} />Income</span>
              <span><span className="dot" style={{ background: 'var(--accent-expense)' }} />Expense</span>
            </div>
          </div>
          <div className="chart-box">
            {report.chartRows.map((row, i) => (
              <div className="chart-row" key={i}>
                <div className="clabel">{row.label}</div>
                <div className="ctrack"><div className="cfill" style={{ width: `${row.pctOfMax}%`, background: row.color }} /></div>
                <div className="cval">{fmtCents(row.total)}</div>
              </div>
            ))}
            {report.chartRows.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 8px' }}>Nothing to chart for this range.</p>
            )}
          </div>

          <button type="button" className="report-start-over" onClick={() => setView('idle')}>Start over</button>
        </>
      )}
    </div>
  );
}

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
    else if (s.kind === 'type') setResult(typeDetail(db, s.label));
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
            {result.kind === 'type' && (
              <>
                <div>This month<b>{fmt(result.thisMonth)}</b></div>
                <div>This year<b>{fmt(result.thisYear)}</b></div>
                {result.pctOfBudgetIsType !== null && <div>Share of budget<b>{result.pctOfBudgetIsType}%</b></div>}
                {result.pctOfTypeSpent !== null && <div>Spent of that<b>{result.pctOfTypeSpent}%</b></div>}
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
  const [editingTx, setEditingTx] = useState(null);

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
  const record = useMemo(() => {
    const txs = transactionsForRange(db, range.start, range.end).map((t) => ({ ...t, _key: `tx-${t.id}` }));
    // Keep every field from the investments row (not just what TxRow displays) —
    // editing needs shares/cost_per_share/account_type/note, which the earlier
    // display-only shape dropped.
    const invests = investmentsForRange(db, range.start, range.end).map((inv) => ({
      ...inv,
      _key: `inv-${inv.id}`,
      type: 'investment',
      amount: inv.shares * inv.cost_per_share,
    }));
    return [...txs, ...invests].sort((a, b) => b.date.localeCompare(a.date));
  }, [db, version, range.start, range.end]);

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
      <AdvancedSearch db={db} notifyChanged={notifyChanged} version={version} />

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

      <div className="section-title" style={{ marginTop: 12 }}>Activity record — {periodPhrase}</div>
      {record.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No activity logged for this period.</p>}
      {record.length > 0 && (
        <div className="record-list">
          {record.map((tx) => (
            <TxRow key={tx._key} tx={tx} onClick={() => setEditingTx(tx)} />
          ))}
        </div>
      )}

      <div className="section-title" style={{ marginTop: 12 }}>Spending report</div>
      <SpendingReport db={db} />

      {editingTx && <EditEntryModal tx={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  );
}
