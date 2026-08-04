import { useState } from 'react';

export default function CreatePassphraseScreen({ onCreate, busy, error }) {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (passphrase.length < 8) { setLocalError('Use at least 8 characters.'); return; }
    if (passphrase !== confirm) { setLocalError("Those don't match."); return; }
    setLocalError('');
    onCreate(passphrase);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Create a passphrase</h1>
        <p>
          This is the one thing that locks and unlocks your data. It's never sent
          anywhere — not to a server, not to us — so if you forget it, there's no way
          to recover what's stored. Write it down somewhere safe, like a password
          manager, not a sticky note.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Passphrase</label>
            <input
              type="password"
              autoComplete="new-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Confirm passphrase</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {(localError || error) && <div className="auth-error">{localError || error}</div>}
          <button className="addbtn" type="submit" disabled={busy}>
            {busy ? 'Setting up your vault…' : 'Create passphrase'}
          </button>
        </form>
        {busy && (
          <div className="auth-progress">
            This takes a few seconds on purpose — the same slowness that's a little
            annoying for you makes guessing your passphrase far too slow for anyone else.
          </div>
        )}
        <p className="auth-note">
          Everything you enter is locked on this device before it's stored anywhere,
          including before it's ever backed up. Nobody but you can read it.
        </p>
      </div>
    </div>
  );
}
