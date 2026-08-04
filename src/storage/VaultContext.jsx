import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { loadVaultRecord, saveVaultRecord } from './persist.js';
import { createVault, openVault, lockBytes, WrongPassphraseError } from '../crypto/vault.js';
import { createDatabase, openDatabase, exportDatabase } from './db.js';

const VaultContext = createContext(null);

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}

const SAVE_DEBOUNCE_MS = 800;

export function VaultProvider({ children }) {
  const [status, setStatus] = useState('checking'); // checking | create | unlock | ready
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0); // bumped after writes so screens re-render

  const dbRef = useRef(null);
  const keyRef = useRef(null);
  const saltRef = useRef(null);
  const kdfParamsRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const record = await loadVaultRecord();
      setStatus(record ? 'unlock' : 'create');
    })();
  }, []);

  const persistNow = useCallback(async () => {
    if (!dbRef.current || !keyRef.current) return;
    const bytes = exportDatabase(dbRef.current);
    const { iv, ciphertext } = await lockBytes(bytes, keyRef.current);
    await saveVaultRecord({ salt: saltRef.current, kdfParams: kdfParamsRef.current, iv, ciphertext });
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistNow, SAVE_DEBOUNCE_MS);
  }, [persistNow]);

  // Screens call this after any mutation made via storage/queries/*.js.
  // Discrete actions (add/delete a row) pass { immediate: true } — pagehide/
  // visibilitychange handlers below can't reliably await an in-flight async
  // save, so a deliberate add/delete shouldn't be left riding the typing
  // debounce when the very next thing the user does is close the app.
  // Continuous edits (typing in an amount field) keep the debounced path.
  const notifyChanged = useCallback((opts = {}) => {
    setVersion((v) => v + 1);
    if (opts.immediate) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      persistNow();
    } else {
      scheduleSave();
    }
  }, [scheduleSave, persistNow]);

  const handleCreate = useCallback(async (passphrase) => {
    setBusy(true); setError('');
    try {
      const db = await createDatabase();
      const bytes = exportDatabase(db);
      const { salt, kdfParams, iv, ciphertext, key } = await createVault(passphrase, bytes);
      await saveVaultRecord({ salt, kdfParams, iv, ciphertext });
      dbRef.current = db; keyRef.current = key; saltRef.current = salt; kdfParamsRef.current = kdfParams;
      setStatus('ready');
    } catch (e) {
      setError(e.message || 'Something went wrong creating your vault.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleUnlock = useCallback(async (passphrase) => {
    setBusy(true); setError('');
    try {
      const record = await loadVaultRecord();
      const { key, dbBytes } = await openVault(passphrase, record);
      const db = await openDatabase(dbBytes);
      dbRef.current = db; keyRef.current = key; saltRef.current = record.salt; kdfParamsRef.current = record.kdfParams;
      setStatus('ready');
    } catch (e) {
      setError(e instanceof WrongPassphraseError ? e.message : 'Something went wrong unlocking your data.');
    } finally {
      setBusy(false);
    }
  }, []);

  // A quick app-switch or phone lock shouldn't drop the last few seconds of
  // edits sitting in the debounce window, so flush immediately when hidden.
  useEffect(() => {
    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        persistNow();
      }
    };
    const onVisibility = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [persistNow]);

  const value = {
    status,
    error,
    busy,
    version,
    db: dbRef.current,
    createVault: handleCreate,
    unlock: handleUnlock,
    notifyChanged,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
