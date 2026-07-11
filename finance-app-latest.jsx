import { useState, useEffect, useMemo, useRef } from "react";

const STORAGE_KEY = "finance-app-data-v1";

const DEFAULT_CATEGORIES = [
  { id: "groceries", label: "Groceries", type: "necessary" },
  { id: "rent", label: "Rent / Mortgage", type: "necessary" },
  { id: "utilities", label: "Utilities", type: "necessary" },
  { id: "car", label: "Car", type: "necessary" },
  { id: "health_insurance", label: "Health insurance", type: "necessary" },
  { id: "self_maintenance", label: "Self maintenance", type: "necessary" },
  { id: "supplies", label: "Supplies", type: "necessary" },
  { id: "eating_out", label: "Eating out", type: "discretionary" },
  { id: "entertainment", label: "Entertainment", type: "discretionary" },
  { id: "travel", label: "Travel", type: "discretionary" },
  { id: "items", label: "Items / Shopping", type: "discretionary" },
  { id: "other", label: "Other", type: "discretionary" },
];

const DEFAULT_BUDGET = {
  incomeMode: "monthly",
  grossIncome: 0,
  taxRate: 25,
  lines: [
    { id: "rent", label: "Rent / Mortgage", amount: 0, catId: "rent" },
    { id: "utilities", label: "Utilities", amount: 0, catId: "utilities" },
    { id: "groceries", label: "Groceries", amount: 0, catId: "groceries" },
    { id: "health_insurance", label: "Health insurance", amount: 0, catId: "health_insurance" },
    { id: "supplies", label: "Supplies", amount: 0, catId: "supplies" },
    { id: "self_maintenance", label: "Self maintenance", amount: 0, catId: "self_maintenance" },
    { id: "car", label: "Car / Transportation", amount: 0, catId: "car" },
    { id: "entertainment", label: "Fun / Entertainment", amount: 0, catId: "entertainment" },
    { id: "savings", label: "Savings / Investments", amount: 0, catId: null },
  ],
};

const ACCOUNT_TYPES = ["Pre-tax (Traditional)", "Post-tax (Roth)", "Taxable"];
const INVESTMENT_TYPES = ["Retirement (401k/IRA)", "Savings", "Brokerage", "HSA", "Other"];

const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtD = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayStr = () => new Date().toISOString().split("T")[0];

const lbl = { display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4, fontWeight: 500 };
const mCard = { background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem" };
const mLabel = { fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 };
const mVal = { fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" };
const sCard = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem" };

// ─── Storage hook ────────────────────────────────────────────────────────────

function useStorage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r) {
          const parsed = JSON.parse(r.value);
          if (!parsed.budget) parsed.budget = DEFAULT_BUDGET;
          else if (!parsed.budget.lines) {
            const old = parsed.budget.allocations || {};
            parsed.budget.lines = DEFAULT_BUDGET.lines.map((l) => ({ ...l, amount: old[l.id] || 0 }));
            parsed.budget.incomeMode = "monthly";
            delete parsed.budget.allocations;
          }
          setData(parsed);
        } else {
          setData({ transactions: [], investments: [], categories: DEFAULT_CATEGORIES, budget: DEFAULT_BUDGET });
        }
      } catch {
        setData({ transactions: [], investments: [], categories: DEFAULT_CATEGORIES, budget: DEFAULT_BUDGET });
      }
    })();
  }, []);
  const save = async (nd) => {
    setData(nd);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(nd)); } catch {}
  };
  return [data, save];
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "log", label: "Daily log", icon: "ti-pencil" },
  { id: "budget", label: "Budget", icon: "ti-coin" },
  { id: "summary", label: "Summary", icon: "ti-chart-bar" },
  { id: "investments", label: "Investments", icon: "ti-building-bank" },
  { id: "retirement", label: "Retirement", icon: "ti-calculator" },
  { id: "settings", label: "Categories", icon: "ti-settings" },
];

// ─── Shared row component ────────────────────────────────────────────────────

function TxRow({ tx, cats, onDelete }) {
  const cat = cats.find((c) => c.id === tx.category);
  const isE = tx.type === "expense";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={{ width: 32, height: 32, borderRadius: "var(--border-radius-md)", background: isE ? "#FCEBEB" : "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={`ti ${isE ? "ti-arrow-up" : "ti-arrow-down"}`} style={{ fontSize: 14, color: isE ? "#A32D2D" : "#3B6D11" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cat ? cat.label : tx.category}
          {tx.detail && <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: 5 }}>· {tx.detail}</span>}
        </div>
        {tx.necessary && (
          <span style={{ fontSize: 10, color: tx.necessary === "necessary" ? "#185FA5" : "#854F0B", background: tx.necessary === "necessary" ? "#E6F1FB" : "#FAEEDA", padding: "1px 5px", borderRadius: 3, marginTop: 2, display: "inline-block" }}>
            {tx.necessary}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: isE ? "#A32D2D" : "#3B6D11", flexShrink: 0, marginRight: 4 }}>
        {isE ? "-" : "+"}{fmtD(tx.amount)}
      </div>
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 2, flexShrink: 0 }}>
        <i className="ti ti-trash" style={{ fontSize: 13 }} />
      </button>
    </div>
  );
}

// ─── Daily Log ───────────────────────────────────────────────────────────────

function DailyLog({ data, update }) {
  const now = todayStr();
  const cats = data.categories;

  const mostRecentMonth = useMemo(() => {
    const months = data.transactions.filter((t) => t.date).map((t) => t.date.slice(0, 7)).sort().reverse();
    return months[0] || now.slice(0, 7);
  }, [data.transactions]);

  const [form, setForm] = useState({ date: now, type: "expense", amount: "", category: "groceries", detail: "", necessary: "necessary" });
  const [filterMonth, setFilterMonth] = useState(mostRecentMonth);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleCatChange = (id) => {
    const c = cats.find((x) => x.id === id);
    setForm((f) => ({ ...f, category: id, necessary: c ? c.type : "necessary" }));
  };

  const add = () => {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    update({ transactions: [...data.transactions, { id: Date.now() + Math.random(), ...form, amount: parseFloat(form.amount) }] });
    setForm((f) => ({ ...f, amount: "", detail: "" }));
  };

  const del = (id) => update({ transactions: data.transactions.filter((t) => t.id !== id) });

  const monthTxs = data.transactions.filter((t) => t.date && t.date.slice(0, 7) === filterMonth);
  const monthIncome = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const byDay = monthTxs.reduce((acc, tx) => { acc[tx.date] = acc[tx.date] || []; acc[tx.date].push(tx); return acc; }, {});
  const sortedDays = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  const budget = data.budget || DEFAULT_BUDGET;
  const gross = budget.grossIncome || 0;
  const netMonthly = budget.incomeMode === "annual" ? (gross * (1 - (budget.taxRate || 0) / 100)) / 12 : gross * (1 - (budget.taxRate || 0) / 100);
  const lines = budget.lines || [];
  const hasBudget = netMonthly > 0 && lines.some((l) => l.amount > 0);
  const budgetSpend = useMemo(() => {
    const map = {};
    monthTxs.filter((t) => t.type === "expense").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [monthTxs]);

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Add entry</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={lbl}>Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["expense", "income"].map((t) => (
              <button key={t} onClick={() => set("type", t)} style={{ flex: 1, padding: "7px 0", border: `0.5px solid ${form.type === t ? (t === "income" ? "#3B6D11" : "#A32D2D") : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", background: form.type === t ? (t === "income" ? "#EAF3DE" : "#FCEBEB") : "transparent", color: form.type === t ? (t === "income" ? "#3B6D11" : "#A32D2D") : "var(--color-text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>Amount ($)</label>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} style={{ width: "100%", boxSizing: "border-box" }} />
        </div>
        {form.type === "expense" ? (
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={(e) => handleCatChange(e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label style={lbl}>Source</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>
              {["salary", "freelance", "investment", "gift", "other"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        )}
      </div>

      {form.type === "expense" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label style={lbl}>Purchase type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["necessary", "discretionary"].map((t) => (
                <button key={t} onClick={() => set("necessary", t)} style={{ flex: 1, padding: "7px 0", border: `0.5px solid ${form.necessary === t ? "#185FA5" : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", background: form.necessary === t ? "#E6F1FB" : "transparent", color: form.necessary === t ? "#185FA5" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Detail (optional)</label>
            <input type="text" placeholder="Store or note…" value={form.detail} onChange={(e) => set("detail", e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      <button onClick={add} style={{ width: "100%", padding: "10px", background: "#3B6D11", color: "#EAF3DE", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: "1.5rem" }}>
        + Add entry
      </button>

      {hasBudget && (
        <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            {filterMonth} · Budget progress
          </div>
          {lines.filter((l) => l.catId && l.amount > 0).map((line) => {
            const spent = budgetSpend[line.catId] || 0;
            const pct = Math.min((spent / line.amount) * 100, 100);
            const over = spent > line.amount;
            const color = over ? "#A32D2D" : pct > 80 ? "#BA7517" : "#3B6D11";
            return (
              <div key={line.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ fontWeight: 500 }}>{line.label}</span>
                  <span style={{ color }}>{fmtD(spent)} / {fmtD(line.amount)}{over ? " ⚠" : ""}</span>
                </div>
                <div style={{ height: 5, background: "var(--color-border-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Monthly log</h3>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ fontSize: 13 }} />
        </div>

        {monthTxs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
            <div style={mCard}><div style={mLabel}>Income</div><div style={{ ...mVal, color: "#3B6D11" }}>{fmtD(monthIncome)}</div></div>
            <div style={mCard}><div style={mLabel}>Expenses</div><div style={{ ...mVal, color: "#A32D2D" }}>{fmtD(monthExpense)}</div></div>
          </div>
        )}
        {monthTxs.length === 0 && <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No entries for this month.</p>}

        {sortedDays.map((date) => {
          const txs = byDay[date].sort((a, b) => b.id - a.id);
          const d = new Date(date + "T12:00:00");
          const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const dayNet = txs.reduce((s, t) => (t.type === "expense" ? s - t.amount : s + t.amount), 0);
          return (
            <div key={date} style={{ marginBottom: "0.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "0.5px solid var(--color-border-secondary)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{dayLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: dayNet >= 0 ? "#3B6D11" : "#A32D2D" }}>{dayNet >= 0 ? "+" : ""}{fmtD(dayNet)}</span>
              </div>
              {txs.map((tx) => <TxRow key={tx.id} tx={tx} cats={cats} onDelete={() => del(tx.id)} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Budget ──────────────────────────────────────────────────────────────────

function Budget({ data, update }) {
  const budget = data.budget || DEFAULT_BUDGET;
  const cats = data.categories || DEFAULT_CATEGORIES;
  const lines = budget.lines || DEFAULT_BUDGET.lines;

  const setBudget = (patch) => update({ budget: { ...budget, ...patch } });
  const setLines = (nl) => setBudget({ lines: nl });
  const updateLine = (id, patch) => setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const deleteLine = (id) => setLines(lines.filter((l) => l.id !== id));

  const [newLine, setNewLine] = useState({ label: "", amount: "", catId: "" });
  const addLine = () => {
    if (!newLine.label.trim()) return;
    setLines([...lines, { id: "line_" + Date.now(), label: newLine.label.trim(), amount: parseFloat(newLine.amount) || 0, catId: newLine.catId || null }]);
    setNewLine({ label: "", amount: "", catId: "" });
  };

  const gross = budget.grossIncome || 0;
  const taxRate = budget.taxRate || 0;
  const isAnnual = budget.incomeMode === "annual";
  const grossMonthly = isAnnual ? gross / 12 : gross;
  const grossAnnual = isAnnual ? gross : gross * 12;
  const taxes = grossMonthly * (taxRate / 100);
  const netMonthly = grossMonthly - taxes;
  const totalAllocated = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const buffer = netMonthly - totalAllocated;

  const nowYM = todayStr().slice(0, 7);
  const [viewMonth, setViewMonth] = useState(nowYM);
  const monthTxs = data.transactions.filter((t) => t.date && t.date.slice(0, 7) === viewMonth && t.type === "expense");
  const spendByCat = useMemo(() => {
    const map = {};
    monthTxs.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [monthTxs]);
  const totalAllocatedTracked = lines.filter((l) => l.catId).reduce((s, l) => s + (l.amount || 0), 0);
  const budgetedSpent = lines.filter((l) => l.catId).reduce((s, l) => s + (spendByCat[l.catId] || 0), 0);
  const remaining = totalAllocatedTracked - budgetedSpent;

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Monthly budget</h2>

      {/* Income */}
      <div style={{ ...sCard, marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Income</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["monthly", "annual"].map((mode) => (
            <button key={mode} onClick={() => setBudget({ incomeMode: mode })} style={{ flex: 1, padding: "7px 0", border: `0.5px solid ${budget.incomeMode === mode ? "#3B6D11" : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", background: budget.incomeMode === mode ? "#EAF3DE" : "transparent", color: budget.incomeMode === mode ? "#3B6D11" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: budget.incomeMode === mode ? 500 : 400 }}>
              {mode[0].toUpperCase() + mode.slice(1)} salary
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={lbl}>{isAnnual ? "Annual gross salary" : "Monthly gross income"}</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-text-secondary)", pointerEvents: "none" }}>$</span>
              <input type="number" min="0" step="100" value={gross || ""} placeholder="0" onChange={(e) => setBudget({ grossIncome: parseFloat(e.target.value) || 0 })} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 20 }} />
            </div>
          </div>
          <div>
            <label style={lbl}>Tax rate</label>
            <div style={{ position: "relative" }}>
              <input type="number" min="0" max="100" step="1" value={taxRate || ""} placeholder="0" onChange={(e) => setBudget({ taxRate: parseFloat(e.target.value) || 0 })} style={{ width: "100%", boxSizing: "border-box", paddingRight: 24 }} />
              <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--color-text-secondary)", pointerEvents: "none" }}>%</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[["Gross/mo", fmt(grossMonthly), "var(--color-text-primary)"], ["Gross/yr", fmt(grossAnnual), "var(--color-text-secondary)"], ["Tax/mo", "-" + fmt(taxes), "#A32D2D"], ["Net/mo", fmt(netMonthly), "#3B6D11"]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center", padding: "0.5rem 0.25rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Allocations */}
      <div style={{ ...sCard, marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Monthly allocations</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 32px", gap: 8, marginBottom: 6 }}>
          {["Line item", "Budget/mo", "Category (tracking)", ""].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>{h}</div>
          ))}
        </div>
        {lines.map((line) => (
          <div key={line.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 32px", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input value={line.label} onChange={(e) => updateLine(line.id, { label: e.target.value })} style={{ fontSize: 13, width: "100%", boxSizing: "border-box" }} />
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--color-text-secondary)", pointerEvents: "none" }}>$</span>
              <input type="number" min="0" step="1" value={line.amount || ""} placeholder="0" onChange={(e) => updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 18 }} />
            </div>
            <select value={line.catId || ""} onChange={(e) => updateLine(line.id, { catId: e.target.value || null })} style={{ width: "100%", boxSizing: "border-box", fontSize: 12 }}>
              <option value="">— no tracking —</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={() => deleteLine(line.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 4 }}>
              <i className="ti ti-trash" style={{ fontSize: 14 }} />
            </button>
          </div>
        ))}

        {/* Add new line row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 32px", gap: 8, alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <input placeholder="New line item…" value={newLine.label} onChange={(e) => setNewLine((n) => ({ ...n, label: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addLine()} style={{ fontSize: 13, width: "100%", boxSizing: "border-box" }} />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--color-text-secondary)", pointerEvents: "none" }}>$</span>
            <input type="number" min="0" step="1" placeholder="0" value={newLine.amount} onChange={(e) => setNewLine((n) => ({ ...n, amount: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", paddingLeft: 18 }} />
          </div>
          <select value={newLine.catId} onChange={(e) => setNewLine((n) => ({ ...n, catId: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", fontSize: 12 }}>
            <option value="">— no tracking —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={addLine} style={{ background: "#3B6D11", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "#EAF3DE", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-plus" style={{ fontSize: 15 }} />
          </button>
        </div>

        {/* Totals */}
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: 12, paddingTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[["Allocated", fmt(totalAllocated), "#185FA5"], ["Buffer", fmt(Math.abs(buffer)), buffer >= 0 ? "#3B6D11" : "#A32D2D"], ["Net/mo", fmt(netMonthly), "var(--color-text-primary)"]].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center", padding: "0.5rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c }}>{buffer < 0 && l === "Buffer" ? "-" : ""}{v}</div>
              </div>
            ))}
          </div>
          {buffer < 0 && <div style={{ marginTop: 10, padding: "0.5rem 0.75rem", background: "#FCEBEB", borderRadius: "var(--border-radius-md)", fontSize: 12, color: "#A32D2D" }}>⚠ Over budget by {fmt(Math.abs(buffer))}. Reduce allocations to balance.</div>}
          {buffer > 0 && totalAllocated > 0 && <div style={{ marginTop: 10, padding: "0.5rem 0.75rem", background: "#EAF3DE", borderRadius: "var(--border-radius-md)", fontSize: 12, color: "#3B6D11" }}>✓ {fmt(buffer)} unallocated — consider adding it to savings.</div>}
        </div>
      </div>

      {/* Spend-down tracker */}
      {netMonthly > 0 && lines.some((l) => l.catId && l.amount > 0) && (
        <div style={sCard}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Spending this month</div>
            <input type="month" value={viewMonth} onChange={(e) => setViewMonth(e.target.value)} style={{ fontSize: 12 }} />
          </div>
          {lines.filter((l) => l.catId && l.amount > 0).map((line) => {
            const spent = spendByCat[line.catId] || 0;
            const rem = line.amount - spent;
            const pct = Math.min((spent / line.amount) * 100, 100);
            const over = spent > line.amount;
            const color = over ? "#A32D2D" : pct > 80 ? "#BA7517" : "#3B6D11";
            return (
              <div key={line.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{line.label}</span>
                  {over
                    ? <span style={{ color: "#A32D2D", fontWeight: 500 }}>{fmtD(spent)}<span style={{ fontSize: 11, marginLeft: 4 }}>+{fmtD(spent - line.amount)} over</span></span>
                    : <span style={{ color, fontWeight: 500 }}>{fmtD(rem)}<span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginLeft: 4 }}>left</span></span>
                  }
                </div>
                <div style={{ height: 8, background: "var(--color-border-tertiary)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                  <span>Spent: {fmtD(spent)}</span>
                  <span>Budget: {fmtD(line.amount)}</span>
                </div>
              </div>
            );
          })}
          <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 12, marginTop: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[["Total budgeted", fmt(totalAllocatedTracked), "var(--color-text-primary)"], ["Spent", fmt(budgetedSpent), "#A32D2D"], ["Remaining", fmt(Math.max(remaining, 0)), remaining >= 0 ? "#3B6D11" : "#A32D2D"]].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center", padding: "0.5rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function Summary({ data }) {
  const [period, setPeriod] = useState("month");
  const now = new Date();
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const availableMonths = useMemo(() => {
    const s = new Set();
    data.transactions.forEach((tx) => { const d = new Date(tx.date + "T12:00:00"); s.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); });
    return Array.from(s).sort().reverse();
  }, [data.transactions]);

  const availableYears = useMemo(() => {
    const s = new Set();
    data.transactions.forEach((tx) => s.add(new Date(tx.date + "T12:00:00").getFullYear()));
    return Array.from(s).sort().reverse();
  }, [data.transactions]);

  const [selMonth, setSelMonth] = useState(availableMonths[0] || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [selYear, setSelYear] = useState(availableYears[0] || now.getFullYear());

  const filtered = useMemo(() => data.transactions.filter((tx) => {
    const d = new Date(tx.date + "T12:00:00");
    if (period === "week") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
    if (period === "month") { const [y, m] = selMonth.split("-").map(Number); return d.getFullYear() === y && d.getMonth() + 1 === m; }
    return d.getFullYear() === selYear;
  }), [data.transactions, period, selMonth, selYear]);

  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const necessary = filtered.filter((t) => t.necessary === "necessary").reduce((s, t) => s + t.amount, 0);
  const discretionary = filtered.filter((t) => t.necessary === "discretionary").reduce((s, t) => s + t.amount, 0);
  const byCategory = useMemo(() => {
    const map = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);
  const maxCat = byCategory[0]?.[1] || 1;
  const cats = data.categories;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
        {["week", "month", "year"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: "6px 16px", border: `0.5px solid ${period === p ? "#3B6D11" : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", background: period === p ? "#EAF3DE" : "transparent", color: period === p ? "#3B6D11" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: period === p ? 500 : 400 }}>
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {period === "month" && availableMonths.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {availableMonths.map((ym) => {
            const [y, m] = ym.split("-").map(Number);
            return <button key={ym} onClick={() => setSelMonth(ym)} style={{ padding: "4px 10px", border: `0.5px solid ${selMonth === ym ? "#534AB7" : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", background: selMonth === ym ? "#EEEDFE" : "transparent", color: selMonth === ym ? "#534AB7" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: selMonth === ym ? 500 : 400 }}>{MONTH_NAMES[m - 1]} {y}</button>;
          })}
        </div>
      )}
      {period === "year" && availableYears.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {availableYears.map((y) => <button key={y} onClick={() => setSelYear(y)} style={{ padding: "4px 10px", border: `0.5px solid ${selYear === y ? "#534AB7" : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", background: selYear === y ? "#EEEDFE" : "transparent", color: selYear === y ? "#534AB7" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: selYear === y ? 500 : 400 }}>{y}</button>)}
        </div>
      )}
      {period === "week" && <div style={{ marginBottom: "1.25rem" }} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: "1.5rem" }}>
        <div style={mCard}><div style={mLabel}>Income</div><div style={{ ...mVal, color: "#3B6D11" }}>{fmt(income)}</div></div>
        <div style={mCard}><div style={mLabel}>Expenses</div><div style={{ ...mVal, color: "#A32D2D" }}>{fmt(expenses)}</div></div>
        <div style={mCard}><div style={mLabel}>Necessary</div><div style={{ ...mVal, color: "#185FA5" }}>{fmt(necessary)}</div></div>
        <div style={mCard}><div style={mLabel}>Discretionary</div><div style={{ ...mVal, color: "#854F0B" }}>{fmt(discretionary)}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.5rem" }}>
        <div style={mCard}><div style={mLabel}>Net</div><div style={{ ...mVal, color: income - expenses >= 0 ? "#3B6D11" : "#A32D2D" }}>{fmt(income - expenses)}</div></div>
        <div style={mCard}><div style={mLabel}>Savings rate</div><div style={{ ...mVal, color: "#534AB7" }}>{income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%</div></div>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 10px" }}>Expenses by category</h3>
      {byCategory.length === 0 && <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>No expense data for this period.</p>}
      {byCategory.map(([catId, total]) => {
        const cat = cats.find((c) => c.id === catId);
        const label = cat ? cat.label : catId;
        const pct = Math.round((total / maxCat) * 100);
        return (
          <div key={catId} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span>{label}</span><span style={{ color: "var(--color-text-secondary)" }}>{fmtD(total)}</span>
            </div>
            <div style={{ height: 6, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#3B6D11", borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
      {byCategory.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: "1.5rem 0 10px" }}>Necessary vs. discretionary</h3>
          <div style={{ height: 12, borderRadius: 6, overflow: "hidden", background: "var(--color-background-secondary)", display: "flex" }}>
            {necessary + discretionary > 0 && <><div style={{ width: `${(necessary / (necessary + discretionary)) * 100}%`, background: "#185FA5" }} /><div style={{ flex: 1, background: "#BA7517" }} /></>}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#185FA5", marginRight: 4 }} />Necessary {fmt(necessary)}</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: "#BA7517", marginRight: 4 }} />Discretionary {fmt(discretionary)}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Investments ─────────────────────────────────────────────────────────────

function Investments({ data, update }) {
  const empty = { ticker: "", shares: "", cost: "", account: ACCOUNT_TYPES[0], investType: INVESTMENT_TYPES[0], note: "" };
  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const add = () => {
    if (!form.ticker || !form.shares || !form.cost) return;
    update({ investments: [...data.investments, { id: Date.now(), ...form, shares: parseFloat(form.shares), cost: parseFloat(form.cost) }] });
    setForm(empty);
  };
  const del = (id) => update({ investments: data.investments.filter((i) => i.id !== id) });
  const totalCost = data.investments.reduce((s, i) => s + i.cost * i.shares, 0);

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Add investment</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={lbl}>Ticker / Name</label><input placeholder="e.g. VOO" value={form.ticker} onChange={(e) => set("ticker", e.target.value.toUpperCase())} style={{ width: "100%", boxSizing: "border-box" }} /></div>
        <div><label style={lbl}>Shares</label><input type="number" min="0" step="0.001" placeholder="0" value={form.shares} onChange={(e) => set("shares", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={lbl}>Cost per share ($)</label><input type="number" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={(e) => set("cost", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>
        <div><label style={lbl}>Account type</label><select value={form.account} onChange={(e) => set("account", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>{ACCOUNT_TYPES.map((a) => <option key={a}>{a}</option>)}</select></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={lbl}>Investment type</label><select value={form.investType} onChange={(e) => set("investType", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }}>{INVESTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label style={lbl}>Note (optional)</label><input placeholder="Account or note…" value={form.note} onChange={(e) => set("note", e.target.value)} style={{ width: "100%", boxSizing: "border-box" }} /></div>
      </div>
      <button onClick={add} style={{ width: "100%", padding: "10px", background: "#3B6D11", color: "#EAF3DE", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: 14, fontWeight: 500, marginBottom: "1.5rem" }}>+ Add investment</button>
      {data.investments.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
            <div style={mCard}><div style={mLabel}>Total cost basis</div><div style={mVal}>{fmt(totalCost)}</div></div>
            <div style={mCard}><div style={mLabel}>Positions</div><div style={mVal}>{data.investments.length}</div></div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>{["Ticker","Shares","Cost/sh","Total","Account","Type",""].map((h) => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>
                {data.investments.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "8px", fontWeight: 500 }}>{inv.ticker}</td>
                    <td style={{ padding: "8px" }}>{inv.shares.toLocaleString()}</td>
                    <td style={{ padding: "8px" }}>{fmtD(inv.cost)}</td>
                    <td style={{ padding: "8px", fontWeight: 500 }}>{fmt(inv.cost * inv.shares)}</td>
                    <td style={{ padding: "8px", fontSize: 11, color: "var(--color-text-secondary)" }}>{inv.account.split(" ")[0]}</td>
                    <td style={{ padding: "8px", fontSize: 11, color: "var(--color-text-secondary)" }}>{inv.investType.split(" ")[0]}</td>
                    <td style={{ padding: "4px" }}><button onClick={() => del(inv.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}><i className="ti ti-trash" style={{ fontSize: 13 }} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Retirement Chart ─────────────────────────────────────────────────────────

function RetirementChart({ cfg, calc }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!calc || !canvasRef.current || typeof Chart === "undefined") return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const r = cfg.annualReturn / 100, mR = r / 12;
    const ages = [], accum = [], preserve = [], spendDown = [];
    for (let age = cfg.currentAge; age <= cfg.retireAge; age++) {
      const yrs = age - cfg.currentAge, mo = yrs * 12;
      const val = Math.round(cfg.startAmount * Math.pow(1 + r, yrs) + (mR > 0 ? cfg.monthlyContrib * ((Math.pow(1 + mR, mo) - 1) / mR) : cfg.monthlyContrib * mo));
      ages.push(age); accum.push(val);
      preserve.push(age === cfg.retireAge ? val : null);
      spendDown.push(age === cfg.retireAge ? val : null);
    }
    let pb = calc.total, sb = calc.total;
    for (let age = cfg.retireAge + 1; age <= 100; age++) {
      ages.push(age); accum.push(null);
      pb = pb * (1 + r) - calc.annualWithdrawal4; preserve.push(Math.round(Math.max(0, pb)));
      sb = sb * (1 + r) - calc.spendDownMonthly * 12; spendDown.push(Math.round(Math.max(0, sb)));
    }
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: ages, datasets: [
        { label: "Accumulation", data: accum, borderColor: "#3B6D11", backgroundColor: "rgba(59,109,17,0.08)", borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.3, spanGaps: false },
        { label: cfg.withdrawal + "% withdrawal", data: preserve, borderColor: "#185FA5", backgroundColor: "rgba(24,95,165,0.06)", borderWidth: 2, borderDash: [5, 3], pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.3, spanGaps: false },
        { label: "Spend down to $100k", data: spendDown, borderColor: "#534AB7", backgroundColor: "rgba(83,74,183,0.06)", borderWidth: 2, borderDash: [2, 3], pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.3, spanGaps: false },
        { label: "You are here", data: ages.map((_, i) => i === 0 ? accum[i] : null), borderColor: "#D85A30", backgroundColor: "#D85A30", pointRadius: ages.map((_, i) => i === 0 ? 7 : 0), showLine: false, spanGaps: false },
      ]},
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { title: (i) => `Age ${i[0].label}`, label: (i) => i.raw === null ? null : ` ${i.dataset.label}: $${Math.round(i.raw).toLocaleString()}` } } },
        scales: {
          x: { ticks: { color: "#888780", font: { size: 11 }, maxTicksLimit: 10, callback: (v, i) => ages[i] % 10 === 0 || ages[i] === cfg.currentAge || ages[i] === cfg.retireAge ? ages[i] : "" }, grid: { color: "rgba(136,135,128,0.12)" } },
          y: { ticks: { color: "#888780", font: { size: 11 }, callback: (v) => v >= 1e6 ? "$" + (v / 1e6).toFixed(1) + "M" : v >= 1000 ? "$" + (v / 1000).toFixed(0) + "k" : "$" + v }, grid: { color: "rgba(136,135,128,0.12)" } },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [cfg, calc]);

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10, fontSize: 12, color: "var(--color-text-secondary)" }}>
        {["#3B6D11", "#185FA5", "#534AB7"].map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 3, background: c, borderRadius: 2, display: "inline-block" }} />{["Accumulation", cfg.withdrawal + "% withdrawal", "Spend down"][i]}</span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D85A30", display: "inline-block" }} />You are here</span>
      </div>
      <div style={{ position: "relative", width: "100%", height: 260 }}><canvas ref={canvasRef} /></div>
    </>
  );
}

// ─── Retirement ───────────────────────────────────────────────────────────────

function Retirement({ data }) {
  const [cfg, setCfg] = useState({ currentAge: 30, retireAge: 65, startAmount: 50000, monthlyContrib: 1000, annualReturn: 7, withdrawal: 4 });
  const [chartReady, setChartReady] = useState(typeof Chart !== "undefined");
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    if (typeof Chart !== "undefined") { setChartReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = () => setChartReady(true);
    document.head.appendChild(s);
  }, []);

  const calc = useMemo(() => {
    const years = cfg.retireAge - cfg.currentAge;
    if (years <= 0) return null;
    const r = cfg.annualReturn / 100, mR = r / 12, mo = years * 12;
    const total = cfg.startAmount * Math.pow(1 + r, years) + (mR > 0 ? cfg.monthlyContrib * ((Math.pow(1 + mR, mo) - 1) / mR) : cfg.monthlyContrib * mo);
    const annualWithdrawal4 = total * (cfg.withdrawal / 100);
    const n = (100 - cfg.retireAge) * 12, disc = Math.pow(1 + mR, -n);
    const spendDownMonthly = n > 0 ? ((total - 100000 * disc) * mR) / (1 - disc) : 0;
    return { total, annualWithdrawal4, monthlyWithdrawal4: annualWithdrawal4 / 12, spendDownMonthly, years };
  }, [cfg]);

  const range = (s, e, step = 1) => Array.from({ length: Math.floor((e - s) / step) + 1 }, (_, i) => +(s + i * step).toFixed(2));

  const Field = ({ label, k, options, prefix, suffix }) => (
    <div>
      <label style={lbl}>{label}</label>
      <select value={cfg[k]} onChange={(e) => set(k, parseFloat(e.target.value))} style={{ width: "100%", boxSizing: "border-box" }}>
        {options.map((o) => <option key={o} value={o}>{(prefix || "") + (o >= 1000 ? o.toLocaleString() : o) + (suffix || "")}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Retirement calculator</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
        <Field label="Current age" k="currentAge" options={range(18, 70)} suffix=" yrs" />
        <Field label="Retirement age" k="retireAge" options={range(40, 80)} suffix=" yrs" />
        <Field label="Starting assets" k="startAmount" prefix="$" options={[0,5000,10000,25000,50000,75000,100000,150000,200000,250000,300000,400000,500000,750000,1000000]} />
        <Field label="Monthly contribution" k="monthlyContrib" prefix="$" options={[0,100,200,300,500,750,1000,1250,1500,2000,2500,3000,4000,5000]} />
        <Field label="Annual growth rate" k="annualReturn" options={[3,4,5,6,6.5,7,7.5,8,9,10,11,12]} suffix="%" />
        <Field label="Withdrawal rate" k="withdrawal" options={[2,2.5,3,3.5,4,4.5,5,5.5,6,7,8]} suffix="%" />
      </div>
      {calc && (
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: "1.25rem" }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>Portfolio lifecycle · age {cfg.currentAge} → 100</h3>
          {chartReady ? <RetirementChart cfg={cfg} calc={calc} /> : <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>Loading chart…</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "1.25rem 0" }}>
            <div style={{ ...mCard, gridColumn: "1 / -1" }}>
              <div style={mLabel}>Portfolio at retirement (age {cfg.retireAge})</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: "#3B6D11" }}>{fmt(calc.total)}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
            <div style={{ ...sCard, borderLeft: "3px solid #185FA5" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{cfg.withdrawal}% annual withdrawal</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#185FA5" }}>{fmt(calc.monthlyWithdrawal4)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)" }}>/mo</span></div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{fmt(calc.annualWithdrawal4)}/yr · portfolio preserved</div>
            </div>
            <div style={{ ...sCard, borderLeft: "3px solid #534AB7" }}>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Spend down to $100k by age 100</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#534AB7" }}>{fmt(calc.spendDownMonthly)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)" }}>/mo</span></div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{fmt(calc.spendDownMonthly * 12)}/yr · {100 - cfg.retireAge} yr runway</div>
            </div>
          </div>
          <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", fontSize: 12, color: "var(--color-text-secondary)" }}>
            ⓘ Assumes {cfg.annualReturn}% annual return. Does not account for inflation or taxes.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Settings ────────────────────────────────────────────────────────

function CategorySettings({ data, update }) {
  const [newCat, setNewCat] = useState({ label: "", type: "necessary" });
  const add = () => {
    if (!newCat.label.trim()) return;
    const id = newCat.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + "_" + Date.now();
    update({ categories: [...data.categories, { id, label: newCat.label.trim(), type: newCat.type }] });
    setNewCat({ label: "", type: "necessary" });
  };
  const del = (id) => update({ categories: data.categories.filter((c) => c.id !== id) });
  const toggle = (id) => update({ categories: data.categories.map((c) => c.id === id ? { ...c, type: c.type === "necessary" ? "discretionary" : "necessary" } : c) });

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Expense categories</h2>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 0 }}>Customize categories and their default purchase type.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "end", marginBottom: "1.5rem" }}>
        <div><label style={lbl}>Category name</label><input placeholder="e.g. Pet care" value={newCat.label} onChange={(e) => setNewCat((n) => ({ ...n, label: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && add()} style={{ width: "100%", boxSizing: "border-box" }} /></div>
        <div><label style={lbl}>Type</label><select value={newCat.type} onChange={(e) => setNewCat((n) => ({ ...n, type: e.target.value }))}><option value="necessary">Necessary</option><option value="discretionary">Discretionary</option></select></div>
        <button onClick={add} style={{ padding: "8px 14px", background: "#3B6D11", color: "#EAF3DE", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Add</button>
      </div>
      {data.categories.map((cat) => (
        <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{cat.label}</div>
          <button onClick={() => toggle(cat.id)} style={{ fontSize: 11, padding: "3px 8px", border: `0.5px solid ${cat.type === "necessary" ? "#185FA5" : "#BA7517"}`, borderRadius: "var(--border-radius-md)", background: cat.type === "necessary" ? "#E6F1FB" : "#FAEEDA", color: cat.type === "necessary" ? "#185FA5" : "#854F0B", cursor: "pointer", fontWeight: 500 }}>{cat.type}</button>
          <button onClick={() => del(cat.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 4 }}><i className="ti ti-trash" style={{ fontSize: 14 }} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [data, save] = useStorage();
  const [tab, setTab] = useState("log");

  if (!data) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>Loading your data…</div>;

  const update = (patch) => save({ ...data, ...patch });

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 720, margin: "0 auto", paddingBottom: "4rem" }}>
      <header style={{ padding: "1.25rem 1.25rem 0.75rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>💰 Personal Finance Tracker</h1>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>Track spending · budget · invest · plan</p>
      </header>
      <nav style={{ display: "flex", borderBottom: "0.5px solid var(--color-border-tertiary)", overflowX: "auto" }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: "1 0 auto", padding: "10px 6px", border: "none", background: "none", cursor: "pointer", fontSize: 11, color: tab === n.id ? "#3B6D11" : "var(--color-text-secondary)", borderBottom: tab === n.id ? "2px solid #3B6D11" : "2px solid transparent", fontWeight: tab === n.id ? 500 : 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
            <i className={`ti ${n.icon}`} style={{ fontSize: 17 }} />
            {n.label}
          </button>
        ))}
      </nav>
      <main style={{ padding: "1.25rem" }}>
        {tab === "log" && <DailyLog data={data} update={update} />}
        {tab === "budget" && <Budget data={data} update={update} />}
        {tab === "summary" && <Summary data={data} />}
        {tab === "investments" && <Investments data={data} update={update} />}
        {tab === "retirement" && <Retirement data={data} />}
        {tab === "settings" && <CategorySettings data={data} update={update} />}
      </main>
    </div>
  );
}
