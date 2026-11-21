import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listInvestments, addInvestment, deleteInvestment, investmentTotalForRange, investmentAllTimeTotal } from '../storage/queries/investments.js';
import { listBudgetLines } from '../storage/queries/budget.js';
import { TrashIcon } from '../components/icons.jsx';
import Ring from '../components/Ring.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import { fmt, fmtCents, todayStr, periodRange, fmtShortDate } from '../utils/format.js';

const emptyForm = () => ({ date: todayStr(), ticker: '', shares: '', cost: '', note: '' });

export default function Investments() {
  const { db, notifyChanged, version } = useVault();
  const [form, setForm] = useState(emptyForm);
  const [editingTx, setEditingTx] = useState(null);

  const positions = useMemo(() => listInvestments(db), [db, version]);
  const budgetLines = useMemo(() => listBudgetLines(db), [db, version]);
  const monthRange = periodRange('month');
  const investedThisMonth = useMemo(() => investmentTotalForRange(db, monthRange.start, monthRange.end), [db, version, monthRange.start, monthRange.end]);
  const investedAllTime = useMemo(() => investmentAllTimeTotal(db), [db, version]);

  const totalCost = positions.reduce((s, p) => s + p.shares * p.cost_per_share, 0);
  // One combined goal — the sum of the three Budget-tab savings categories —
  // rather than a per-category breakdown, since entries no longer carry a
  // type to match against (docs/DATA_MODEL.md's Investments section).
  const savingsGoal = budgetLines.filter((l) => l.type === 'savings').reduce((s, l) => s + l.amount_monthly, 0);
  const savingsPct = savingsGoal > 0 ? Math.min((investedThisMonth / savingsGoal) * 100, 100) : 0;

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
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Note <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
          <input type="text" placeholder="Which brokerage or account…" value={form.note} onChange={(e) => set('note', e.target.value)} />
        </div>
        <button className="addbtn" type="submit" style={{ background: 'var(--accent-purple)', color: 'var(--accent-purple-bg)' }}>+ Add investment</button>
      </form>

      <div className="section-title">Invested this month</div>
      <div className="goal-cell" style={{ maxWidth: 200, margin: '0 auto' }}>
        <Ring pct={savingsPct} ringColor="var(--accent-purple)" value={fmt(investedThisMonth)} sub={`of ${fmt(savingsGoal)}`} />
        <div className="goal-pct">{savingsGoal > 0 ? Math.round(savingsPct) : 0}% to goal</div>
      </div>
      <div className="goal-caption" style={{ textAlign: 'center' }}>
        Goal is the sum of your three Budget-tab savings categories. All-time contributed: <b style={{ color: 'var(--text-primary)' }}>{fmt(investedAllTime)}</b>
      </div>

      <div className="section-title">Positions <span className="bgroup-total">{fmt(totalCost)}</span></div>
      <div className="budgetlist">
        {positions.length === 0 && (
          <div style={{ padding: '10px 9px', fontSize: 13, color: 'var(--text-secondary)' }}>No positions logged yet.</div>
        )}
        {positions.map((p) => (
          <div className="budgetrow clickable" key={p.id} onClick={() => setEditingTx({ ...p, type: 'investment' })}>
            <span className="dot" style={{ background: 'var(--accent-purple)' }} />
            <div className="bmid">
              <div className="bname">
                {p.ticker} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>· {p.shares} sh @ {fmtCents(p.cost_per_share)}</span>
              </div>
              <div className="bnote">
                {[p.account_type, p.investment_type, p.note, fmtShortDate(p.date)].filter(Boolean).join(' · ')}
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
