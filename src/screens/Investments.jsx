import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listInvestments, addInvestment, deleteInvestment, investmentTotalsByType } from '../storage/queries/investments.js';
import { listBudgetLines } from '../storage/queries/budget.js';
import { TrashIcon } from '../components/icons.jsx';
import Ring from '../components/Ring.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import { fmt, fmtCents, todayStr, periodRange, fmtShortDate } from '../utils/format.js';

const ACCOUNT_TYPES = ['Pre-tax (Traditional)', 'Post-tax (Roth)', 'Taxable'];
const INVESTMENT_TYPES = ['Retirement (401k/IRA)', 'Short-term savings', 'Big-purchase savings', 'Brokerage', 'HSA', 'Other'];

// Matches the Budget-tab savings categories to Investment types by name, per
// docs/DATA_MODEL.md's mapping table. If one of these three presets gets
// renamed on the Budget tab, its goal-progress ring here just reads $0 of $0 —
// same graceful-degradation tradeoff as components/categoryColors.js.
const GOAL_MAP = [
  { label: 'Retirement', budgetLabel: 'Retirement saving', investType: 'Retirement (401k/IRA)', color: 'var(--cat-retirement)' },
  { label: 'Short-term', budgetLabel: 'Short term savings', investType: 'Short-term savings', color: 'var(--cat-shortterm)' },
  { label: 'Big purchase', budgetLabel: 'Savings', investType: 'Big-purchase savings', color: 'var(--cat-bigpurchase)' },
];

const emptyForm = () => ({
  date: todayStr(),
  ticker: '',
  shares: '',
  cost: '',
  account: ACCOUNT_TYPES[2],
  investType: INVESTMENT_TYPES[3],
  note: '',
});

function investTypeColor(type) {
  const found = GOAL_MAP.find((g) => g.investType === type);
  return found ? found.color : 'var(--inv-other)';
}

export default function Investments() {
  const { db, notifyChanged, version } = useVault();
  const [form, setForm] = useState(emptyForm);
  const [editingTx, setEditingTx] = useState(null);

  const positions = useMemo(() => listInvestments(db), [db, version]);
  const budgetLines = useMemo(() => listBudgetLines(db), [db, version]);
  const monthRange = periodRange('month');
  const monthByType = useMemo(() => investmentTotalsByType(db, monthRange.start, monthRange.end), [db, version, monthRange.start, monthRange.end]);
  const allTimeByType = useMemo(() => investmentTotalsByType(db, '0000-01-01', '9999-12-31'), [db, version]);

  const totalCost = positions.reduce((s, p) => s + p.shares * p.cost_per_share, 0);
  const allTimeGoalsTotal = GOAL_MAP.reduce((s, g) => s + (allTimeByType[g.investType] || 0), 0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const shares = parseFloat(form.shares);
    const cost = parseFloat(form.cost);
    if (!form.ticker.trim() || !shares || !cost) return;
    addInvestment(db, {
      date: form.date,
      ticker: form.ticker.trim().toUpperCase(),
      shares,
      costPerShare: cost,
      accountType: form.account,
      investmentType: form.investType,
      note: form.note.trim(),
    });
    notifyChanged({ immediate: true });
    setForm(emptyForm());
  };

  const remove = (id) => {
    deleteInvestment(db, id);
    notifyChanged({ immediate: true });
  };

  return (
    <div>
      <p className="tab-intro">
        A ledger of what you hold and where — cost basis only (money in), not current market value.
        Check prices elsewhere.
      </p>

      <div className="section-title" style={{ marginTop: 2 }}>Add investment</div>
      <form className="invest-form-card" onSubmit={submit}>
        <div className="grid2" style={{ marginBottom: 8 }}>
          <div className="field"><label>Date</label><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div className="field"><label>Ticker / name</label><input type="text" placeholder="e.g. VOO" value={form.ticker} onChange={(e) => set('ticker', e.target.value)} required /></div>
        </div>
        <div className="grid2" style={{ marginBottom: 8 }}>
          <div className="field"><label>Shares</label><input type="number" step="0.001" min="0" placeholder="0" value={form.shares} onChange={(e) => set('shares', e.target.value)} required /></div>
          <div className="field"><label>Cost per share</label><input type="number" step="0.01" min="0" placeholder="0.00" value={form.cost} onChange={(e) => set('cost', e.target.value)} required /></div>
        </div>
        <div className="grid2" style={{ marginBottom: 8 }}>
          <div className="field">
            <label>Account type</label>
            <select value={form.account} onChange={(e) => set('account', e.target.value)}>
              {ACCOUNT_TYPES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Investment type</label>
            <select value={form.investType} onChange={(e) => set('investType', e.target.value)}>
              {INVESTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Note <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
          <input type="text" placeholder="Which brokerage or account…" value={form.note} onChange={(e) => set('note', e.target.value)} />
        </div>
        <button className="addbtn" type="submit" style={{ background: 'var(--accent-purple)', color: 'var(--accent-purple-bg)' }}>+ Add investment</button>
      </form>

      <div className="section-title">Savings goals progress</div>
      <div className="goal-pair goal-trio">
        {GOAL_MAP.map((g) => {
          const goal = budgetLines.find((l) => l.label === g.budgetLabel)?.amount_monthly || 0;
          const have = monthByType[g.investType] || 0;
          const pct = goal > 0 ? Math.min((have / goal) * 100, 100) : 0;
          return (
            <div className="goal-cell" key={g.investType}>
              <div className="section-title">{g.label}</div>
              <Ring pct={pct} ringColor={g.color} value={fmt(have)} sub={`of ${fmt(goal)}`} />
              <div className="goal-pct">{goal > 0 ? Math.round(pct) : 0}% this mo.</div>
            </div>
          );
        })}
      </div>
      <div className="goal-caption">
        Goals are set on the Budget tab. All-time contributed across all positions: <b style={{ color: 'var(--text-primary)' }}>{fmt(allTimeGoalsTotal)}</b>
      </div>

      <div className="section-title">Positions <span className="bgroup-total">{fmt(totalCost)}</span></div>
      <div className="budgetlist">
        {positions.length === 0 && (
          <div style={{ padding: '10px 9px', fontSize: 13, color: 'var(--text-secondary)' }}>No positions logged yet.</div>
        )}
        {positions.map((p) => (
          <div className="budgetrow clickable" key={p.id} onClick={() => setEditingTx({ ...p, type: 'investment' })}>
            <span className="dot" style={{ background: investTypeColor(p.investment_type) }} />
            <div className="bmid">
              <div className="bname">
                {p.ticker} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>· {p.shares} sh @ {fmtCents(p.cost_per_share)}</span>
              </div>
              <div className="bnote">
                {p.account_type} · {p.investment_type}{p.note ? ` · ${p.note}` : ''} · {fmtShortDate(p.date)}
              </div>
            </div>
            <div className="bamt"><span style={{ fontSize: 13, fontWeight: 700 }}>{fmt(p.shares * p.cost_per_share)}</span></div>
            <button className="del" type="button" onClick={(e) => { e.stopPropagation(); remove(p.id); }} aria-label={`Remove ${p.ticker}`}>
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      {editingTx && <EditEntryModal tx={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  );
}
