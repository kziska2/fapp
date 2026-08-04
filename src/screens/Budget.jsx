import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listCategories, addCategory, deleteCategory } from '../storage/queries/categories.js';
import {
  listBudgetLines,
  setBudgetAmount,
  listExceptionalPeriods,
  addExceptionalPeriod,
  updateExceptionalPeriod,
  deleteExceptionalPeriod,
  getIncomeOverride,
  setIncomeOverride,
  getIncomeCalculatorInputs,
  setIncomeCalculatorInputs,
} from '../storage/queries/budget.js';
import { monthTotals } from '../storage/queries/transactions.js';
import { categoryColor } from '../components/categoryColors.js';
import { TrashIcon, PencilIcon } from '../components/icons.jsx';
import { calculateIncomeBreakdown, FILING_STATUSES, STATE_OPTIONS } from '../utils/tax.js';
import { fmt, currentYearMonth, fmtShortDate, previousYearMonths } from '../utils/format.js';

const emptyCalcInputs = () => ({ annualIncome: '', filingStatus: 'single', stateCode: 'CA', preTaxDeductions: '' });

function SalaryCalculator({ db, notifyChanged, onApply }) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState(() => getIncomeCalculatorInputs(db) || emptyCalcInputs());

  const set = (key, value) => {
    const next = { ...inputs, [key]: value };
    setInputs(next);
    setIncomeCalculatorInputs(db, next);
    notifyChanged();
  };

  const breakdown = useMemo(() => {
    if (!inputs.annualIncome) return null;
    return calculateIncomeBreakdown({
      annualIncome: Number(inputs.annualIncome) || 0,
      filingStatus: inputs.filingStatus,
      stateCode: inputs.stateCode,
      preTaxDeductions: Number(inputs.preTaxDeductions) || 0,
    });
  }, [inputs]);

  const stateName = STATE_OPTIONS.find((s) => s.code === inputs.stateCode)?.name || inputs.stateCode;

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" className="reset-link" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide salary calculator' : 'Calculate from annual salary instead'}
      </button>
      {open && (
        <div className="calc-panel">
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Annual gross income</label>
              <input type="number" placeholder="0" value={inputs.annualIncome} onChange={(e) => set('annualIncome', e.target.value)} />
            </div>
            <div className="field">
              <label>Filing status</label>
              <select value={inputs.filingStatus} onChange={(e) => set('filingStatus', e.target.value)}>
                {FILING_STATUSES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>State</label>
              <select value={inputs.stateCode} onChange={(e) => set('stateCode', e.target.value)}>
                {STATE_OPTIONS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Pre-tax deductions <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(401k, insurance)</span></label>
              <input type="number" placeholder="0" value={inputs.preTaxDeductions} onChange={(e) => set('preTaxDeductions', e.target.value)} />
            </div>
          </div>

          {breakdown && (
            <>
              <div className="calc-math">
                <div className="calc-row"><span>Annual gross income</span><span>{fmt(breakdown.grossAnnual)}</span></div>
                {breakdown.preTaxDeductions > 0 && (
                  <div className="calc-row"><span>− Pre-tax deductions</span><span>-{fmt(breakdown.preTaxDeductions)}</span></div>
                )}
                <div className="calc-row calc-sub"><span>Federal standard deduction</span><span>-{fmt(breakdown.federalStdDeduction)}</span></div>
                <div className="calc-row calc-sub"><span>Federal taxable income</span><span>{fmt(breakdown.taxableIncomeFederal)}</span></div>
                <div className="calc-row"><span>− Federal income tax (est.)</span><span>-{fmt(breakdown.federalTax)}</span></div>
                <div className="calc-row calc-sub"><span>Social Security</span><span>-{fmt(breakdown.socialSecurityTax)}</span></div>
                <div className="calc-row calc-sub">
                  <span>Medicare{breakdown.additionalMedicareTax > 0 ? ' + additional Medicare' : ''}</span>
                  <span>-{fmt(breakdown.medicareTax + breakdown.additionalMedicareTax)}</span>
                </div>
                <div className="calc-row"><span>− FICA (payroll tax)</span><span>-{fmt(breakdown.ficaTax)}</span></div>
                <div className="calc-row"><span>− {stateName} state tax (est.)</span><span>-{fmt(breakdown.stateTax)}</span></div>
                <div className="calc-row calc-total"><span>Estimated annual take-home</span><span>{fmt(breakdown.annualTakeHome)}</span></div>
                <div className="calc-row calc-total"><span>÷ 12 → Estimated monthly income</span><span>{fmt(breakdown.monthlyTakeHome)}</span></div>
              </div>
              <p style={{ fontSize: 9.5, color: 'var(--text-tertiary)', margin: '6px 2px 8px', lineHeight: 1.4 }}>
                A 2026 tax-year estimate using the standard deduction — no credits, itemization, or local/county
                taxes. FICA is calculated on gross wages before pre-tax deductions, matching how a traditional
                401(k) actually works.
              </p>
              <button
                type="button"
                className="addbtn"
                style={{ background: 'var(--accent-necessary)', color: 'var(--accent-necessary-bg)' }}
                onClick={() => onApply(breakdown.monthlyTakeHome)}
              >
                Use {fmt(breakdown.monthlyTakeHome)} as my monthly income
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const SECTION_META = {
  necessary: { title: 'Necessary', color: 'var(--accent-necessary)', bg: 'var(--accent-necessary-bg)' },
  discretionary: { title: 'Discretionary', color: 'var(--accent-discretionary)', bg: 'var(--accent-discretionary-bg)' },
  savings: { title: 'Savings goals', color: 'var(--cat-retirement)', bg: 'var(--cat-retirement-bg)' },
};

function BufferBox({ income, necSum, discSum, savSum, periodTotal, periodCount }) {
  const buffer = income - necSum - discSum - savSum;
  const warn = buffer < 100;
  return (
    <div className="bufferbox">
      <div className="buf-row"><span className="lbl">Income</span><span className="val">{fmt(income)}</span></div>
      <div className="buf-row"><span className="lbl">Necessary</span><span className="val">{fmt(necSum)}</span></div>
      <div className="buf-row"><span className="lbl">Discretionary</span><span className="val">{fmt(discSum)}</span></div>
      <div className="buf-row"><span className="lbl">Savings</span><span className="val">{fmt(savSum)}</span></div>
      <div className="buf-row">
        <span className="lbl">Exceptional period</span>
        <span className="val">{periodCount === 0 ? 'None set' : fmt(periodTotal)}</span>
      </div>
      <div className="buf-row buf-total">
        <span className="lbl">Buffer</span>
        <span className={`val ${warn ? 'warn' : ''}`}>{fmt(buffer)}</span>
      </div>
      {warn && <div className="buf-warn">⚠ Buffer is under $100 — your budget is close to your income.</div>}
    </div>
  );
}

function CategorySection({ type, lines, onAmountChange, onDelete, onAdd }) {
  const meta = SECTION_META[type];
  const total = lines.reduce((s, l) => s + l.amount_monthly, 0);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const submitAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ label: name.trim(), amount: parseFloat(value) || 0 });
    setName(''); setValue(''); setShowAdd(false);
  };

  return (
    <div>
      <div className="bgroup-title" style={{ color: meta.color }}>
        <span>{meta.title}</span><span className="bgroup-total">{fmt(total)}/mo</span>
      </div>
      <div className="budgetlist">
        {lines.map((line) => (
          <div className="budgetrow" key={line.category_id}>
            <span className="dot" style={{ background: categoryColor(line.label, line.type) }} />
            <div className="bmid">
              <div className="bname">{line.label}</div>
              {line.label === 'Debts' && <div className="bnote">Links to a future debt tab</div>}
              {type === 'savings' && <div className="bnote">Tracked via Investments, not expenses</div>}
            </div>
            <div className="bamt">
              <span className="cur">$</span>
              <input
                type="number"
                value={line.amount_monthly || ''}
                onChange={(e) => onAmountChange(line.category_id, parseFloat(e.target.value) || 0)}
              />
            </div>
            <button className="del" onClick={() => onDelete(line.category_id)} type="button" aria-label={`Remove ${line.label}`}>
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button className="addbtn ghost" type="button" onClick={() => setShowAdd((s) => !s)}>+ Add a category</button>
      {showAdd && (
        <form className="addcat-form" onSubmit={submitAdd}>
          <div className="grid2" style={{ margin: '6px 0' }}>
            <div className="field"><label>Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
            <div className="field"><label>Monthly $</label><input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></div>
          </div>
          <button className="addbtn" type="submit" style={{ background: meta.color, color: meta.bg }}>Add category</button>
        </form>
      )}
    </div>
  );
}

export default function Budget() {
  const { db, notifyChanged, version } = useVault();
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [periodDraft, setPeriodDraft] = useState({ startDate: '', endDate: '', name: '', amount: '' });

  const budgetLines = useMemo(() => listBudgetLines(db), [db, version]);
  const periods = useMemo(() => listExceptionalPeriods(db), [db, version]);
  const realIncome = useMemo(() => monthTotals(db, currentYearMonth()).income, [db, version]);
  const rawOverride = useMemo(() => getIncomeOverride(db), [db, version]);
  const income = rawOverride !== null ? rawOverride : realIncome;

  // Paychecks don't necessarily land evenly through the month, so "real income
  // logged so far this month" can be misleadingly low early on. Rather than
  // capping the budget number to that partial figure, we let it be set freely
  // and warn against the trailing 3-month average instead (docs/BUDGET.md).
  const avgIncome3mo = useMemo(() => {
    const months = previousYearMonths(3);
    const total = months.reduce((s, ym) => s + monthTotals(db, ym).income, 0);
    return total / months.length;
  }, [db, version]);
  const overAverage = avgIncome3mo > 0 && income > avgIncome3mo;

  const necLines = budgetLines.filter((l) => l.type === 'necessary');
  const discLines = budgetLines.filter((l) => l.type === 'discretionary');
  const savLines = budgetLines.filter((l) => l.type === 'savings');
  const necSum = necLines.reduce((s, l) => s + l.amount_monthly, 0);
  const discSum = discLines.reduce((s, l) => s + l.amount_monthly, 0);
  const savSum = savLines.reduce((s, l) => s + l.amount_monthly, 0);
  const spendTotal = necSum + discSum;
  const periodTotal = periods.reduce((s, p) => s + p.amount, 0);

  const handleAmountChange = (categoryId, amount) => {
    setBudgetAmount(db, categoryId, amount);
    notifyChanged();
  };

  const handleDelete = (categoryId) => {
    deleteCategory(db, categoryId);
    notifyChanged({ immediate: true });
  };

  const handleAdd = (type) => ({ label, amount }) => {
    const id = addCategory(db, { label, type });
    setBudgetAmount(db, id, amount);
    notifyChanged({ immediate: true });
  };

  const onIncomeInput = (raw) => {
    setIncomeOverride(db, Number(raw) || 0);
    notifyChanged();
  };

  const resetIncome = () => {
    setIncomeOverride(db, null);
    notifyChanged({ immediate: true });
  };

  const applyCalculatedIncome = (monthly) => {
    setIncomeOverride(db, Math.round(monthly));
    notifyChanged({ immediate: true });
  };

  const openAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodDraft({ startDate: '', endDate: '', name: '', amount: '' });
    setShowPeriodForm(true);
  };
  const openEditPeriod = (p) => {
    setEditingPeriod(p.id);
    setPeriodDraft({ startDate: p.start_date, endDate: p.end_date, name: p.name || '', amount: String(p.amount) });
    setShowPeriodForm(true);
  };
  const closePeriodForm = () => {
    setShowPeriodForm(false);
    setEditingPeriod(null);
  };
  const savePeriod = (e) => {
    e.preventDefault();
    const amount = parseFloat(periodDraft.amount);
    if (!periodDraft.startDate || !periodDraft.endDate || !amount) return;
    const payload = { startDate: periodDraft.startDate, endDate: periodDraft.endDate, name: periodDraft.name.trim(), amount };
    if (editingPeriod) updateExceptionalPeriod(db, editingPeriod, payload);
    else addExceptionalPeriod(db, payload);
    notifyChanged({ immediate: true });
    closePeriodForm();
  };
  const removePeriod = (id) => {
    deleteExceptionalPeriod(db, id);
    notifyChanged({ immediate: true });
  };

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 2px 6px', lineHeight: 1.5 }}>
        This is the plan, not the log — the numbers here feed the rings on Daily Log and Summary.
      </p>

      <BufferBox income={income} necSum={necSum} discSum={discSum} savSum={savSum} periodTotal={periodTotal} periodCount={periods.length} />

      <div className="goalbox">
        <div className="glabel">Monthly income</div>
        <div className="ghint" style={{ marginTop: 0 }}>
          Real income logged this month so far: <b style={{ color: 'var(--text-primary)' }}>{fmt(realIncome)}</b>
          {' · '}Average of the last 3 months: <b style={{ color: 'var(--text-primary)' }}>{fmt(avgIncome3mo)}</b>
        </div>
        <div className="gamt">
          <span className="cur">$</span>
          <input type="number" value={income || ''} onChange={(e) => onIncomeInput(e.target.value)} />
        </div>
        <div className="ghint">
          Set this to whatever you want to budget against — handy since paychecks don't land evenly through the
          month.{rawOverride !== null && <> <button type="button" className="reset-link" onClick={resetIncome}>Use real income instead</button></>}
        </div>
        {overAverage && (
          <div className="buf-warn">⚠ That's {fmt(income - avgIncome3mo)} more than your average income over the last 3 months.</div>
        )}
        <SalaryCalculator db={db} notifyChanged={notifyChanged} onApply={applyCalculatedIncome} />
      </div>

      <CategorySection type="necessary" lines={necLines} onAmountChange={handleAmountChange} onDelete={handleDelete} onAdd={handleAdd('necessary')} />
      <CategorySection type="discretionary" lines={discLines} onAmountChange={handleAmountChange} onDelete={handleDelete} onAdd={handleAdd('discretionary')} />

      <div className="deriv-line">
        <span>Spending budget: <b>{fmt(spendTotal)}</b>/mo</span>
        <span>≈ <b>{fmt(spendTotal / 4.3)}</b>/wk</span>
        <span><b>{fmt(spendTotal * 12)}</b>/yr</span>
      </div>

      <div style={{ marginTop: 16 }}>
        <CategorySection type="savings" lines={savLines} onAmountChange={handleAmountChange} onDelete={handleDelete} onAdd={handleAdd('savings')} />
      </div>
      <p style={{ fontSize: 9.5, color: 'var(--text-tertiary)', margin: '5px 2px 0', lineHeight: 1.4 }}>
        These amounts are the goal — Summary's Invested ring compares them against what you've actually logged on the Investments tab.
      </p>

      <div className="section-title" style={{ marginTop: 14 }}>Exceptional period budget</div>
      <div>
        {periods.map((p) => (
          <div className="period-card" key={p.id}>
            <div>
              <div className="pdates">{fmtShortDate(p.start_date)} – {fmtShortDate(p.end_date)}</div>
              <div className="pname">{p.name || 'Exceptional period'}</div>
            </div>
            <div className="pamt">{fmt(p.amount)}</div>
            <button className="pedit" type="button" onClick={() => openEditPeriod(p)} aria-label="Edit period">
              <PencilIcon />
            </button>
            <button className="del" type="button" onClick={() => removePeriod(p.id)} aria-label="Delete period">
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
      <button className="addbtn ghost" type="button" onClick={showPeriodForm ? closePeriodForm : openAddPeriod}>
        + Add an exceptional period
      </button>
      {showPeriodForm && (
        <form className="period-form" onSubmit={savePeriod}>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Start date</label>
              <input type="date" value={periodDraft.startDate} onChange={(e) => setPeriodDraft((d) => ({ ...d, startDate: e.target.value }))} required />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={periodDraft.endDate} onChange={(e) => setPeriodDraft((d) => ({ ...d, endDate: e.target.value }))} required />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>What's this for? <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
            <input type="text" value={periodDraft.name} onChange={(e) => setPeriodDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Family trip" />
          </div>
          <div className="field">
            <label>Total budget for this period</label>
            <input type="number" value={periodDraft.amount} onChange={(e) => setPeriodDraft((d) => ({ ...d, amount: e.target.value }))} required />
          </div>
          <button className="addbtn" type="submit" style={{ background: 'var(--accent-necessary)', color: 'var(--accent-necessary-bg)' }}>
            {editingPeriod ? 'Save changes' : 'Save period budget'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 16 }}>
        <BufferBox income={income} necSum={necSum} discSum={discSum} savSum={savSum} periodTotal={periodTotal} periodCount={periods.length} />
      </div>
    </div>
  );
}
