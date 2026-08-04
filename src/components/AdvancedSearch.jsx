import { useMemo, useState } from 'react';
import { listCategories } from '../storage/queries/categories.js';
import { listMerchantNames } from '../storage/queries/merchants.js';
import { advancedSearch, listSavedSearches, saveSearch, deleteSavedSearch } from '../storage/queries/search.js';
import { TrashIcon } from './icons.jsx';
import TxRow from './TxRow.jsx';
import { fmt } from '../utils/format.js';

const emptyFilters = () => ({
  startDate: '', endDate: '', minAmount: '', maxAmount: '',
  categoryId: '', necessary: '', merchantName: '', noteTerm: '',
});

export default function AdvancedSearch({ db, notifyChanged, version }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [results, setResults] = useState(null);
  const [saveName, setSaveName] = useState('');

  const categories = useMemo(() => listCategories(db), [db, version]);
  const merchantNames = useMemo(() => listMerchantNames(db), [db, version]);
  const savedSearches = useMemo(() => listSavedSearches(db), [db, version]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const hasAnyFilter = Object.values(filters).some((v) => v !== '');

  const runSearch = () => setResults(advancedSearch(db, filters));

  const applySaved = (s) => {
    setFilters({ ...emptyFilters(), ...s.filters });
    setResults(advancedSearch(db, s.filters));
    setOpen(true);
  };

  const doSave = () => {
    if (!saveName.trim() || !hasAnyFilter) return;
    saveSearch(db, saveName.trim(), filters);
    notifyChanged({ immediate: true });
    setSaveName('');
  };

  const removeSaved = (id) => {
    deleteSavedSearch(db, id);
    notifyChanged({ immediate: true });
  };

  const clear = () => {
    setFilters(emptyFilters());
    setResults(null);
  };

  return (
    <div className="advanced-search">
      <button type="button" className="reset-link" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide advanced search' : 'Advanced search'}
      </button>

      {open && (
        <div className="advanced-panel">
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>From date</label>
              <input type="date" value={filters.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="field">
              <label>To date</label>
              <input type="date" value={filters.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Min amount</label>
              <input type="number" placeholder="$0" value={filters.minAmount} onChange={(e) => set('minAmount', e.target.value)} />
            </div>
            <div className="field">
              <label>Max amount</label>
              <input type="number" placeholder="No limit" value={filters.maxAmount} onChange={(e) => set('maxAmount', e.target.value)} />
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Category</label>
              <select value={filters.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Any category</option>
                {categories.filter((c) => c.type !== 'savings').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Type</label>
              <select value={filters.necessary} onChange={(e) => set('necessary', e.target.value)}>
                <option value="">Any type</option>
                <option value="necessary">Necessary</option>
                <option value="discretionary">Discretionary</option>
              </select>
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div className="field">
              <label>Vendor</label>
              <select value={filters.merchantName} onChange={(e) => set('merchantName', e.target.value)}>
                <option value="">Any vendor</option>
                {merchantNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Note contains</label>
              <input type="text" placeholder="a word or phrase…" value={filters.noteTerm} onChange={(e) => set('noteTerm', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="addbtn" style={{ flex: 1 }} onClick={runSearch}>Search</button>
            <button type="button" className="addbtn ghost" style={{ flex: 1 }} onClick={clear}>Clear</button>
          </div>

          {results && (
            <>
              <div className="section-title" style={{ marginTop: 12 }}>
                {results.rows.length} match{results.rows.length === 1 ? '' : 'es'}
                <span className="bgroup-total">{fmt(results.total)}</span>
              </div>
              <div className="record-list">
                {results.rows.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>
              {results.rows.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No matches.</p>}
              <div className="save-search-row">
                <input
                  type="text"
                  placeholder="Name this search to save it…"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
                <button type="button" className="addbtn" disabled={!saveName.trim()} onClick={doSave}>Save</button>
              </div>
            </>
          )}

          {savedSearches.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 12 }}>Saved searches</div>
              {savedSearches.map((s) => (
                <div className="period-card" key={s.id}>
                  <div className="saved-name">{s.name}</div>
                  <button type="button" className="reset-link" onClick={() => applySaved(s)}>Run</button>
                  <button className="del" type="button" onClick={() => removeSaved(s.id)} aria-label={`Delete saved search ${s.name}`}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
