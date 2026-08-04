import { useMemo, useState } from 'react';
import { useVault } from '../storage/VaultContext.jsx';
import { getRetirementSettings, saveRetirementSettings } from '../storage/queries/settings.js';
import RetirementChart from './RetirementChart.jsx';
import { fmt } from '../utils/format.js';

// Ported from finance-app-latest.jsx's Retirement component — same fields,
// math, and chart. Only the storage (now persisted to the encrypted DB
// instead of transient component state) and theme tokens changed.

const lbl = { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500 };
const mCard = { background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem' };
const mLabel = { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 };
const mVal = { fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' };
const sCard = { background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)', borderRadius: 'var(--radius)', padding: '0.875rem 1rem' };

const DEFAULT_CFG = { currentAge: 30, retireAge: 65, startAmount: 50000, monthlyContrib: 1000, annualReturn: 7, withdrawal: 4 };

function Field({ cfg, set, label, k, options, prefix, suffix }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={cfg[k]} onChange={(e) => set(k, parseFloat(e.target.value))} style={{ width: '100%', boxSizing: 'border-box' }}>
        {options.map((o) => (
          <option key={o} value={o}>{(prefix || '') + (o >= 1000 ? o.toLocaleString() : o) + (suffix || '')}</option>
        ))}
      </select>
    </div>
  );
}

export default function Retirement() {
  const { db, notifyChanged } = useVault();
  const [cfg, setCfg] = useState(() => getRetirementSettings(db) || DEFAULT_CFG);

  const set = (k, v) => {
    setCfg((c) => {
      const next = { ...c, [k]: v };
      saveRetirementSettings(db, next);
      notifyChanged({ immediate: true });
      return next;
    });
  };

  const range = (s, e, step = 1) => Array.from({ length: Math.floor((e - s) / step) + 1 }, (_, i) => +(s + i * step).toFixed(2));

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

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 500, marginTop: 0 }}>Retirement calculator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
        <Field cfg={cfg} set={set} label="Current age" k="currentAge" options={range(18, 70)} suffix=" yrs" />
        <Field cfg={cfg} set={set} label="Retirement age" k="retireAge" options={range(40, 80)} suffix=" yrs" />
        <Field cfg={cfg} set={set} label="Starting assets" k="startAmount" prefix="$" options={[0, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 750000, 1000000]} />
        <Field cfg={cfg} set={set} label="Monthly contribution" k="monthlyContrib" prefix="$" options={[0, 100, 200, 300, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000]} />
        <Field cfg={cfg} set={set} label="Annual growth rate" k="annualReturn" options={[3, 4, 5, 6, 6.5, 7, 7.5, 8, 9, 10, 11, 12]} suffix="%" />
        <Field cfg={cfg} set={set} label="Withdrawal rate" k="withdrawal" options={[2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8]} suffix="%" />
      </div>
      {calc && (
        <div style={{ borderTop: '0.5px solid var(--border-tertiary)', paddingTop: '1.25rem' }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 12px' }}>Portfolio lifecycle · age {cfg.currentAge} → 100</h3>
          <RetirementChart cfg={cfg} calc={calc} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '1.25rem 0' }}>
            <div style={{ ...mCard, gridColumn: '1 / -1' }}>
              <div style={mLabel}>Portfolio at retirement (age {cfg.retireAge})</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--accent-income)' }}>{fmt(calc.total)}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
            <div style={{ ...sCard, borderLeft: '3px solid #185FA5' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{cfg.withdrawal}% annual withdrawal</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#185FA5' }}>{fmt(calc.monthlyWithdrawal4)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{fmt(calc.annualWithdrawal4)}/yr · portfolio preserved</div>
            </div>
            <div style={{ ...sCard, borderLeft: '3px solid var(--accent-purple)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Spend down to $100k by age 100</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--accent-purple)' }}>{fmt(calc.spendDownMonthly)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>/mo</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{fmt(calc.spendDownMonthly * 12)}/yr · {100 - cfg.retireAge} yr runway</div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: 12, color: 'var(--text-secondary)' }}>
            ⓘ Assumes {cfg.annualReturn}% annual return. Does not account for inflation or taxes.
          </div>
        </div>
      )}
    </div>
  );
}
