import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { listCategories, addCategory, deleteCategory, renameCategory, retypeCategory } from '../storage/queries/categories.js';
import { TrashIcon } from '../components/icons.jsx';
import { categoryColor } from '../components/categoryColors.js';

// Ported from finance-app-latest.jsx's CategorySettings, extended for the
// three-way necessary/discretionary/savings type (the prototype only had two).
const TYPE_OPTIONS = ['necessary', 'discretionary', 'savings'];

export default function CategorySettings() {
  const { db, notifyChanged, version } = useVault();
  const [newCat, setNewCat] = useState({ label: '', type: 'necessary' });

  const categories = useMemo(() => listCategories(db), [db, version]);

  const add = (e) => {
    e.preventDefault();
    if (!newCat.label.trim()) return;
    addCategory(db, { label: newCat.label.trim(), type: newCat.type });
    notifyChanged({ immediate: true });
    setNewCat({ label: '', type: 'necessary' });
  };

  const del = (id) => {
    deleteCategory(db, id);
    notifyChanged({ immediate: true });
  };

  const rename = (id, label) => {
    renameCategory(db, id, label);
    notifyChanged({ immediate: true });
  };

  const retype = (id, type) => {
    retypeCategory(db, id, type);
    notifyChanged({ immediate: true });
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Expense categories</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0 }}>
        Add, rename, retype, or remove your categories. Savings-type categories aren't logged
        as expenses — their Budget-tab amount is a goal, tracked via the Investments tab.
      </p>
      <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'end', marginBottom: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>Category name</label>
          <input
            placeholder="e.g. Pet care"
            value={newCat.label}
            onChange={(e) => setNewCat((n) => ({ ...n, label: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 }}>Type</label>
          <select value={newCat.type} onChange={(e) => setNewCat((n) => ({ ...n, type: e.target.value }))}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button type="submit" className="addbtn" style={{ marginTop: 0, width: 'auto', padding: '8px 14px' }}>Add</button>
      </form>
      {categories.map((cat) => (
        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-tertiary)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: categoryColor(cat.label, cat.type) }} />
          <input
            defaultValue={cat.label}
            onBlur={(e) => e.target.value.trim() && e.target.value !== cat.label && rename(cat.id, e.target.value.trim())}
            style={{ flex: 1, fontSize: 16, fontWeight: 500, border: 'none', background: 'none', color: 'var(--text-primary)', padding: '4px 0' }}
          />
          <select
            value={cat.type}
            onChange={(e) => retype(cat.id, e.target.value)}
            style={{ fontSize: 16, fontWeight: 500 }}
          >
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => del(cat.id)} className="del" type="button" aria-label={`Remove ${cat.label}`}>
            <TrashIcon />
          </button>
        </div>
      ))}
    </div>
  );
}
