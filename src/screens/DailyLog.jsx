import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listCategories } from '../storage/queries/categories.js';
import { listMerchantNames } from '../storage/queries/merchants.js';
import { listJobNames } from '../storage/queries/jobs.js';
import { listBudgetLines } from '../storage/queries/budget.js';
import {
  addExpense,
  addIncome,
  deleteTransaction,
  listTransactionsForMonth,
  monthTotals,
} from '../storage/queries/transactions.js';
import {
  listRecurring,
  addRecurring,
  updateRecurring,
  setRecurringActive,
  deleteRecurring,
  isRecurringEnded,
} from '../storage/queries/recurring.js';
import { describeSchedule, WEEKDAY_NAMES } from '../utils/recurrence.js';
import { ArrowUpIcon, ArrowDownIcon, RepeatIcon, PencilIcon, TrashIcon } from '../components/icons.jsx';
import { categoryColor } from '../components/categoryColors.js';
import Ring from '../components/Ring.jsx';
import TxRow from '../components/TxRow.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';
import { fmt, fmtCents, todayStr, currentYearMonth, fmtDayLabel, fmtShortDate } from '../utils/format.js';

const emptyExpense = () => ({ amount: '', categoryId: '', necessary: 'necessary', date: todayStr(), merchant: '' });
const emptyPaycheck = () => ({ job: '', amount: '', date: todayStr() });
const emptyRecurring = () => ({
  name: '', amount: '', categoryId: '', necessary: 'necessary',
  frequency: 'monthly', anchorDay: String(new Date().getDate()),
  startDate: todayStr(), endDate: '', occurrences: '',
});

function recurringStatusLabel(rule) {
  if (isRecurringEnded(rule)) return 'Ended';
  if (!rule.active) return 'Paused';
  return `Next: ${fmtShortDate(rule.next_due_date)}`;
}

// A recurring rule's own add/edit/list UI — kept separate from the expense and
// paycheck forms above since it manages *rules* (which then generate ordinary
// transactions via materializeDueRecurring, called on every vault unlock), not
// transactions directly.
function RecurringPanel({ db, notifyChanged, version, categories }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyRecurring);

  const rules = useMemo(() => listRecurring(db), [db, version]);

  const onCategoryChange = (categoryId) => {
    const cat = categories.find((c) => String(c.id) === String(categoryId));
    setDraft((d) => ({ ...d, categoryId, necessary: cat ? cat.type : d.necessary }));
  };

  const openAdd = () => { setEditingId(null); setDraft(emptyRecurring()); setShowForm(true); };
  const openEdit = (r) => {
    setEditingId(r.id);
    setDraft({
      name: r.name,
      amount: String(r.amount),
      categoryId: String(r.category_id),
      necessary: r.necessary,
      frequency: r.frequency,
      anchorDay: String(r.anchor_day),
      startDate: r.start_date,
      endDate: r.end_date || '',
      occurrences: r.occurrences_total ? String(r.occurrences_total) : '',
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const submit = (e) => {
    e.preventDefault();
    const amount = parseFloat(draft.amount);
    if (!draft.name.trim() || !amount || !draft.categoryId) return;
    const shared = {
      name: draft.name.trim(),
      amount,
      categoryId: Number(draft.categoryId),
      necessary: draft.necessary,
      endDate: draft.endDate || null,
      occurrencesTotal: draft.occurrences ? Number(draft.occurrences) : null,
    };
    if (editingId) {
      updateRecurring(db, editingId, shared);
    } else {
      addRecurring(db, {
        ...shared,
        frequency: draft.frequency,
        anchorDay: Number(draft.anchorDay),
        startDate: draft.startDate,
      });
    }
    notifyChanged({ immediate: true });
    closeForm();
  };

  const togglePause = (r) => {
    setRecurringActive(db, r.id, !r.active);
    notifyChanged({ immediate: true });
  };
  const remove = (id) => {
    deleteRecurring(db, id);
    notifyChanged({ immediate: true });
  };

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 2px 6px', lineHeight: 1.5 }}>
        Set up a bill or subscription once and it logs itself as an expense on schedule — no
        different from typing it in by hand, just automatic.
      </p>

      {rules.map((r) => (
        <div className={`period-card${!r.active ? ' paused' : ''}`} key={r.id}>
          <span className="dot" style={{ background: categoryColor(r.category_label, r.category_type) }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pdates">{r.name}</div>
            <div className="pname">{describeSchedule(r.frequency, r.anchor_day)} · {r.category_label || 'Uncategorized'}</div>
            <div className="pname">{recurringStatusLabel(r)}</div>
          </div>
          <div className="pamt">{fmt(r.amount)}</div>
          {!isRecurringEnded(r) && (
            <button className="recur-toggle" type="button" onClick={() => togglePause(r)}>
              {r.active ? 'Pause' : 'Resume'}
            </button>
          )}
          <button className="pedit" type="button" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
            <PencilIcon />
          </button>
          <button className="del" type="button" onClick={() => remove(r.id)} aria-label={`Delete ${r.name}`}>
            <TrashIcon />
          </button>
        </div>
      ))}

      <button className="addbtn ghost" type="button" onClick={showForm ? closeForm : openAdd} style={{ marginTop: rules.length ? 8 : 0 }}>
        {showForm ? 'Cancel' : '+ Add a recurring expense'}
      </button>

      {showForm && (
        <form className="period-form" onSubmit={submit}>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Name</label>
            <input
              type="text"
              placeholder="e.g. Rent, Netflix"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={draft.amount}
                onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={draft.categoryId} onChange={(e) => onCategoryChange(e.target.value)} required>
                <option value="" disabled>Choose…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 8 }}>
            <label>Purchase type</label>
            <div className="seg">
              <button type="button" className={draft.necessary === 'necessary' ? 'on-necessary' : ''} onClick={() => setDraft((d) => ({ ...d, necessary: 'necessary' }))}>
                Necessary
              </button>
              <button type="button" className={draft.necessary === 'discretionary' ? 'on-discretionary' : ''} onClick={() => setDraft((d) => ({ ...d, necessary: 'discretionary' }))}>
                Discretionary
              </button>
            </div>
          </div>

          {editingId ? (
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', margin: '0 2px 8px', lineHeight: 1.4 }}>
              {describeSchedule(draft.frequency, Number(draft.anchorDay))}, since {fmtShortDate(draft.startDate)}.
              Delete and re-add this to change the schedule itself.
            </p>
          ) : (
            <>
              <div className="field" style={{ marginBottom: 8 }}>
                <label>Frequency</label>
                <div className="seg">
                  <button type="button" className={draft.frequency === 'monthly' ? 'on-necessary' : ''} onClick={() => setDraft((d) => ({ ...d, frequency: 'monthly' }))}>
                    Monthly
                  </button>
                  <button type="button" className={draft.frequency === 'weekly' ? 'on-necessary' : ''} onClick={() => setDraft((d) => ({ ...d, frequency: 'weekly' }))}>
                    Weekly
                  </button>
                </div>
              </div>
              <div className="grid2" style={{ marginBottom: 8 }}>
                <div className="field">
                  <label>{draft.frequency === 'monthly' ? 'Day of month' : 'Day of week'}</label>
                  {draft.frequency === 'monthly' ? (
                    <select value={draft.anchorDay} onChange={(e) => setDraft((d) => ({ ...d, anchorDay: e.target.value }))}>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ) : (
                    <select value={draft.anchorDay} onChange={(e) => setDraft((d) => ({ ...d, anchorDay: e.target.value }))}>
                      {WEEKDAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
                    </select>
                  )}
                </div>
                <div className="field">
                  <label>Starting</label>
                  <input type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} required />
                </div>
              </div>
            </>
          )}

          <div className="grid2">
            <div className="field">
              <label>Ends on <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input type="date" value={draft.endDate} onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))} />
            </div>
            <div className="field">
              <label>Stop after <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input type="number" min="1" placeholder="times" value={draft.occurrences} onChange={(e) => setDraft((d) => ({ ...d, occurrences: e.target.value }))} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={closeForm}>Cancel</button>
            <button type="submit" className="addbtn">{editingId ? 'Save changes' : 'Add recurring expense'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function DailyLog() {
  const { db, notifyChanged, version } = useVault();
  const [mode, setMode] = useState('expense');
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [paycheckForm, setPaycheckForm] = useState(emptyPaycheck);
  const [editingTx, setEditingTx] = useState(null);

  const categories = useMemo(
    () => listCategories(db).filter((c) => c.type !== 'savings'),
    [db, version]
  );
  const merchantNames = useMemo(() => listMerchantNames(db), [db, version]);
  const jobNames = useMemo(() => listJobNames(db), [db, version]);
  const budgetLines = useMemo(() => listBudgetLines(db), [db, version]);

  const ym = currentYearMonth();
  const monthTx = useMemo(() => listTransactionsForMonth(db, ym), [db, version, ym]);
  const totals = useMemo(() => monthTotals(db, ym), [db, version, ym]);

  const totalBudget = useMemo(
    () => budgetLines.filter((l) => l.type !== 'savings').reduce((s, l) => s + l.amount_monthly, 0),
    [budgetLines]
  );

  const spent = totals.expense;
  const balance = totals.income - spent;
  const over = totalBudget > 0 && spent > totalBudget;
  const pct = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;
  const overPct = over ? Math.min(((spent - totalBudget) / totalBudget) * 100, 100) : 0;

  const byDay = useMemo(() => {
    const map = {};
    monthTx.forEach((tx) => {
      map[tx.date] = map[tx.date] || [];
      map[tx.date].push(tx);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthTx]);

  const onCategoryChange = (categoryId) => {
    const cat = categories.find((c) => String(c.id) === String(categoryId));
    setExpenseForm((f) => ({ ...f, categoryId, necessary: cat ? cat.type : f.necessary }));
  };

  const submitExpense = (e) => {
    e.preventDefault();
    const amount = parseFloat(expenseForm.amount);
    if (!amount || !expenseForm.categoryId) return;
    addExpense(db, {
      date: expenseForm.date,
      amount,
      categoryId: Number(expenseForm.categoryId),
      necessary: expenseForm.necessary,
      merchantName: expenseForm.merchant,
    });
    notifyChanged({ immediate: true });
    setExpenseForm((f) => ({ ...emptyExpense(), categoryId: f.categoryId, necessary: f.necessary, date: f.date }));
  };

  const submitPaycheck = (e) => {
    e.preventDefault();
    const amount = parseFloat(paycheckForm.amount);
    if (!amount || !paycheckForm.job.trim()) return;
    addIncome(db, { date: paycheckForm.date, amount, jobName: paycheckForm.job });
    notifyChanged({ immediate: true });
    setPaycheckForm(emptyPaycheck());
  };

  const removeTx = (id) => {
    deleteTransaction(db, id);
    notifyChanged({ immediate: true });
  };

  return (
    <div>
      <div className="foldertabs">
        <button className={`foldertab ${mode === 'expense' ? 'active' : ''}`} onClick={() => setMode('expense')} type="button">
          <ArrowUpIcon /> Log expense
        </button>
        <button className={`foldertab ${mode === 'paycheck' ? 'active' : ''}`} onClick={() => setMode('paycheck')} type="button">
          <ArrowDownIcon /> Log paycheck
        </button>
        <button className={`foldertab ${mode === 'recurring' ? 'active' : ''}`} onClick={() => setMode('recurring')} type="button">
          <RepeatIcon /> Auto expenses
        </button>
      </div>

      <div className="folderbody">
        {mode === 'recurring' ? (
          <RecurringPanel db={db} notifyChanged={notifyChanged} version={version} categories={categories} />
        ) : mode === 'expense' ? (
          <form onSubmit={submitExpense}>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="field">
                <label>Category</label>
                <select value={expenseForm.categoryId} onChange={(e) => onCategoryChange(e.target.value)} required>
                  <option value="" disabled>Choose…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid2">
              <div className="field">
                <label>Purchase type</label>
                <div className="seg">
                  <button
                    type="button"
                    className={expenseForm.necessary === 'necessary' ? 'on-necessary' : ''}
                    onClick={() => setExpenseForm((f) => ({ ...f, necessary: 'necessary' }))}
                  >
                    Necessary
                  </button>
                  <button
                    type="button"
                    className={expenseForm.necessary === 'discretionary' ? 'on-discretionary' : ''}
                    onClick={() => setExpenseForm((f) => ({ ...f, necessary: 'discretionary' }))}
                  >
                    Discretionary
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label>Detail <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input
                type="text"
                list="merchant-list"
                placeholder="Store or note…"
                value={expenseForm.merchant}
                onChange={(e) => setExpenseForm((f) => ({ ...f, merchant: e.target.value }))}
              />
              <datalist id="merchant-list">
                {merchantNames.map((n) => <option key={n} value={n} />)}
              </datalist>
            </div>
            <button className="addbtn expense-mode" type="submit">+ Add expense</button>
          </form>
        ) : (
          <form onSubmit={submitPaycheck}>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Job</label>
                <input
                  type="text"
                  list="job-list"
                  placeholder="Where's this from?"
                  value={paycheckForm.job}
                  onChange={(e) => setPaycheckForm((f) => ({ ...f, job: e.target.value }))}
                  required
                />
                <datalist id="job-list">
                  {jobNames.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div className="field">
                <label>Amount received</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={paycheckForm.amount}
                  onChange={(e) => setPaycheckForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Date received</label>
              <input type="date" value={paycheckForm.date} onChange={(e) => setPaycheckForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 2px 0', lineHeight: 1.5 }}>
              For money that's actually landed in your bank — not an estimate or your general salary.
            </p>
            <button className="addbtn" type="submit">+ Add paycheck</button>
          </form>
        )}
      </div>

      {totalBudget > 0 && (
        <>
          <div className="ring-row">
            <div className="ring-wrap">
              <Ring pct={pct} ringColor={over ? 'var(--accent-expense)' : 'var(--accent-necessary)'} value={fmt(spent)} sub={`of ${fmt(totalBudget)}`} />
              {over && (
                <div className="ring-badge" style={{ '--pct2': overPct }}>
                  <div className="hole"><b>{fmt(spent - totalBudget)}<br />{Math.round(overPct)}%</b></div>
                </div>
              )}
            </div>
            <div className="ring-side">
              <div className="line"><span className="lbl">Spent this month</span><span className="val neg">{fmt(spent)}</span></div>
              <div className="line"><span className="lbl">Received this month</span><span className="val pos">{fmt(totals.income)}</span></div>
              <div className="line"><span className="lbl">Monthly balance</span><span className={`val ${balance >= 0 ? 'pos' : 'neg'}`}>{fmtCents(balance)}</span></div>
            </div>
          </div>
        </>
      )}

      <div className="section-title" style={{ marginTop: 10 }}>Monthly log</div>
      {byDay.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No entries yet this month.</p>
      )}
      {byDay.map(([date, txs]) => (
        <div key={date}>
          <div className="daylabel">{fmtDayLabel(date)}</div>
          {txs.map((tx) => (
            <TxRow key={tx.id} tx={tx} onDelete={() => removeTx(tx.id)} onClick={() => setEditingTx(tx)} />
          ))}
        </div>
      ))}

      {editingTx && <EditEntryModal tx={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  );
}
