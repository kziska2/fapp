import { openDB } from 'idb';

const IDB_NAME = 'fapp-vault';
const STORE = 'vault';
const RECORD_KEY = 'main';

async function getIdb() {
  return openDB(IDB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
}

// The stored record is { salt, kdfParams, iv, ciphertext } — everything needed
// to attempt an unlock except the passphrase itself, which is never stored.
export async function loadVaultRecord() {
  const idb = await getIdb();
  return idb.get(STORE, RECORD_KEY);
}

export async function saveVaultRecord(record) {
  const idb = await getIdb();
  await idb.put(STORE, record, RECORD_KEY);
}
