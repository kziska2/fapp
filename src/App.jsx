import { useState } from 'react';
import { VaultProvider, useVault } from './storage/VaultContext.jsx';
import CreatePassphraseScreen from './auth/CreatePassphraseScreen.jsx';
import LockScreen from './auth/LockScreen.jsx';
import DailyLog from './screens/DailyLog.jsx';
import Budget from './screens/Budget.jsx';
import Summary from './screens/Summary.jsx';
import Investments from './screens/Investments.jsx';
import Retirement from './screens/Retirement.jsx';
import CategorySettings from './screens/CategorySettings.jsx';
import { DailyLogIcon, BudgetIcon, SummaryIcon, BankIcon, CalculatorIcon, SettingsIcon } from './components/icons.jsx';
import { seedSyntheticData } from './dev/seed.js';

// Dev-only: never rendered in a production build (import.meta.env.DEV is
// inlined to `false` and this whole branch is eliminated at build time), so
// synthetic fixtures can never reach the app the user actually installs.
function DevSeedButton() {
  const { db, notifyChanged } = useVault();
  return (
    <button
      type="button"
      onClick={() => { seedSyntheticData(db); notifyChanged({ immediate: true }); }}
      style={{
        display: 'block', width: '100%', margin: '0 0 10px', padding: '6px',
        fontSize: 11, fontWeight: 650, border: '1px dashed var(--accent-purple)',
        borderRadius: 8, background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', cursor: 'pointer',
      }}
    >
      DEV: load synthetic sample data
    </button>
  );
}

const TABS = [
  { id: 'log', label: 'Daily log', icon: DailyLogIcon, Comp: DailyLog },
  { id: 'budget', label: 'Budget', icon: BudgetIcon, Comp: Budget },
  { id: 'summary', label: 'Summary', icon: SummaryIcon, Comp: Summary },
  { id: 'invest', label: 'Invest', icon: BankIcon, Comp: Investments },
  { id: 'retirement', label: 'Retirement', icon: CalculatorIcon, Comp: Retirement },
  { id: 'settings', label: 'Categories', icon: SettingsIcon, Comp: CategorySettings },
];

function AppShell() {
  const { status, error, busy, createVault, unlock } = useVault();
  const [tab, setTab] = useState('log');

  if (status === 'checking') {
    return (
      <div className="auth-shell">
        <div className="auth-card"><p>Loading…</p></div>
      </div>
    );
  }
  if (status === 'create') {
    return <CreatePassphraseScreen onCreate={createVault} busy={busy} error={error} />;
  }
  if (status === 'unlock') {
    return <LockScreen onUnlock={unlock} busy={busy} error={error} />;
  }

  const active = TABS.find((t) => t.id === tab);
  const ActiveComp = active.Comp;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="app-shell">
      <div className="app-header">
        <h2>{active.label}</h2>
        <span className="today">{today}</span>
      </div>
      <div className="app-main">
        {import.meta.env.DEV && <DevSeedButton />}
        <ActiveComp />
      </div>
      <div className="tabbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={`tabbtn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} type="button">
              <Icon />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <AppShell />
    </VaultProvider>
  );
}
