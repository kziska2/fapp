import { useState } from 'react';

export default function LockScreen({ onUnlock, busy, error }) {
  const [passphrase, setPassphrase] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onUnlock(passphrase);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Enter your passphrase to unlock your data.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Passphrase</label>
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="addbtn" type="submit" disabled={busy || !passphrase}>
            {busy ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
        <p className="auth-note">
          There's no "forgot passphrase" option — a recovery path would mean someone
          other than you could unlock this data, which defeats the point.
        </p>
      </div>
    </div>
  );
}
