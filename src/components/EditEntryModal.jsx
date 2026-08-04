import { useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listCategories } from '../storage/queries/categories.js';
import { listMerchantNames } from '../storage/queries/merchants.js';
import { listJobNames } from '../storage/queries/jobs.js';
import { updateExpense, updateIncome } from '../storage/queries/transactions.js';
import { updateInvestment } from '../storage/queries/investments.js';

const ACCOUNT_TYPES = ['Pre-tax (Traditional)', 'Post-tax (Roth)', 'Taxable'];
const INVESTMENT_TYPES = ['Retirement (401k/IRA)', 'Short-term savings', 'Big-purchase savings', 'Brokerage', 'HSA', 'Other'];

// One shared modal for editing any entry kind (expense/income/investment) — the
// fields mirror each type's Add form exactly, so this is also where you fill in
// detail you skipped when logging quickly.
export default function EditEntryModal({ tx, onClose }) {
  const { db, notifyChanged } = useVault();
  const isExpense = tx.type === 'expense';
  const isIncome = tx.type === 'income';

  const categories = isExpense ? listCategories(db).filter((c) => c.type !== 'savings') : [];
  const merchantNames = isExpense ? listMerchantNames(db) : [];
  const jobNames = isIncome ? listJobNames(db) : [];

  const [form, setForm] = useState(() => {
    if (isExpense) {
      return {
        date: tx.date,
        amount: String(tx.amount),
        categoryId: String(tx.category_id || ''),
        necessary: tx.necessary || 'necessary',
        merchant: tx.merchant_name || '',
      };
    }
    if (isIncome) {
      return { date: tx.date, amount: String(tx.amount), job: tx.job_name || '' };
    }
    return {
      date: tx.date,
      ticker: tx.ticker,
      shares: String(tx.shares),
      cost: String(tx.cost_per_share),
      account: tx.account_type,
      investType: tx.investment_type,
      note: tx.note || '',
    };
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onCategoryChange = (categoryId) => {
    const cat = categories.find((c) => String(c.id) === String(categoryId));
    setForm((f) => ({ ...f, categoryId, necessary: cat ? cat.type : f.necessary }));
  };

  const save = (e) => {
    e.preventDefault();
    if (isExpense) {
      const amount = parseFloat(form.amount);
      if (!amount || !form.categoryId) return;
      updateExpense(db, tx.id, {
        date: form.date,
        amount,
        categoryId: Number(form.categoryId),
        necessary: form.necessary,
        merchantName: form.merchant,
      });
    } else if (isIncome) {
      const amount = parseFloat(form.amount);
      if (!amount || !form.job.trim()) return;
      updateIncome(db, tx.id, { date: form.date, amount, jobName: form.job });
    } else {
      const shares = parseFloat(form.shares);
      const cost = parseFloat(form.cost);
      if (!form.ticker.trim() || !shares || !cost) return;
      updateInvestment(db, tx.id, {
        date: form.date,
        ticker: form.ticker.trim().toUpperCase(),
        shares,
        costPerShare: cost,
        accountType: form.account,
        investmentType: form.investType,
        note: form.note.trim(),
      });
    }
    notifyChanged({ immediate: true });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <h3>Edit {isExpense ? 'expense' : isIncome ? 'paycheck' : 'investment'}</h3>

        {isExpense && (
          <>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Amount</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.categoryId} onChange={(e) => onCategoryChange(e.target.value)} required>
                  <option value="" disabled>Choose…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Purchase type</label>
                <div className="seg">
                  <button type="button" className={form.necessary === 'necessary' ? 'on-necessary' : ''} onClick={() => set('necessary', 'necessary')}>Necessary</button>
                  <button type="button" className={form.necessary === 'discretionary' ? 'on-discretionary' : ''} onClick={() => set('necessary', 'discretionary')}>Discretionary</button>
                </div>
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Detail <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input type="text" list="edit-merchant-list" value={form.merchant} onChange={(e) => set('merchant', e.target.value)} placeholder="Store or note…" />
              <datalist id="edit-merchant-list">{merchantNames.map((n) => <option key={n} value={n} />)}</datalist>
            </div>
          </>
        )}

        {isIncome && (
          <>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Job</label>
                <input type="text" list="edit-job-list" value={form.job} onChange={(e) => set('job', e.target.value)} required />
                <datalist id="edit-job-list">{jobNames.map((n) => <option key={n} value={n} />)}</datalist>
              </div>
              <div className="field">
                <label>Amount received</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>Date received</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </>
        )}

        {!isExpense && !isIncome && (
          <>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </div>
              <div className="field">
                <label>Ticker / name</label>
                <input type="text" value={form.ticker} onChange={(e) => set('ticker', e.target.value)} required />
              </div>
            </div>
            <div className="grid2" style={{ marginBottom: 8 }}>
              <div className="field">
                <label>Shares</label>
                <input type="number" step="0.001" min="0" value={form.shares} onChange={(e) => set('shares', e.target.value)} required />
              </div>
              <div className="field">
                <label>Cost per share</label>
                <input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => set('cost', e.target.value)} required />
              </div>
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
            <div className="field">
              <label>Note <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></label>
              <input type="text" value={form.note} onChange={(e) => set('note', e.target.value)} />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="addbtn">Save changes</button>
        </div>
      </form>
    </div>
  );
}
