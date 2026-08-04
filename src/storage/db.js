import initSqlJs from 'sql.js';

let SQL = null;

async function loadSql() {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: (file) => `${import.meta.env.BASE_URL}${file}` });
  }
  return SQL;
}

const SCHEMA = `
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('necessary', 'discretionary', 'savings')),
  sort_order INTEGER NOT NULL
);

CREATE TABLE merchants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount REAL NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  merchant_id INTEGER REFERENCES merchants(id),
  job_id INTEGER REFERENCES jobs(id),
  necessary TEXT CHECK (necessary IN ('necessary', 'discretionary')),
  note TEXT
);

CREATE TABLE budget_lines (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL UNIQUE REFERENCES categories(id),
  amount_monthly REAL NOT NULL DEFAULT 0
);

CREATE TABLE exceptional_periods (
  id INTEGER PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  name TEXT,
  amount REAL NOT NULL
);

CREATE TABLE investments (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  ticker TEXT NOT NULL,
  shares REAL NOT NULL,
  cost_per_share REAL NOT NULL,
  account_type TEXT NOT NULL,
  investment_type TEXT NOT NULL,
  note TEXT
);

-- Single-row-per-key settings: manual income override (nullable = use real income),
-- the retirement calculator's saved defaults, schema bookkeeping.
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE saved_searches (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  filters TEXT NOT NULL
);
`;

// Vaults created before a table existed have that table missing from their
// serialized bytes — sql.js loads exactly what was saved, no migration on its
// own. IF NOT EXISTS backfills new tables into already-encrypted vaults
// without touching anything that's already there.
function migrate(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      filters TEXT NOT NULL
    );
  `);
}

// Matches the preset list in docs/DATA_MODEL.md.
const DEFAULT_CATEGORIES = [
  ['Rent', 'necessary'],
  ['Utilities', 'necessary'],
  ['Transportation', 'necessary'],
  ['Groceries', 'necessary'],
  ['Eating out / order in', 'discretionary'],
  ['Health', 'necessary'],
  ['Dependents', 'necessary'],
  ['Supplies', 'necessary'],
  ['Fun', 'discretionary'],
  ['Entertainment', 'discretionary'],
  ['Debts', 'necessary'],
  ['Education', 'necessary'],
  ['Giving', 'discretionary'],
  ['Retirement saving', 'savings'],
  ['Short term savings', 'savings'],
  ['Savings', 'savings'],
];

export async function createDatabase() {
  const sql = await loadSql();
  const db = new sql.Database();
  db.run(SCHEMA);
  const stmt = db.prepare('INSERT INTO categories (label, type, sort_order) VALUES (?, ?, ?)');
  DEFAULT_CATEGORIES.forEach(([label, type], i) => {
    stmt.run([label, type, i]);
  });
  stmt.free();
  return db;
}

export async function openDatabase(bytes) {
  const sql = await loadSql();
  const db = new sql.Database(bytes);
  migrate(db);
  return db;
}

export function exportDatabase(db) {
  return db.export();
}

// Runs a SELECT and returns an array of plain objects (sql.js's raw exec()
// returns column/value arrays, which is awkward for callers to consume).
export function query(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Runs an INSERT/UPDATE/DELETE. Returns the last insert row id (useful for INSERTs).
export function run(db, sql, params = []) {
  db.run(sql, params);
  return db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0]?.[0] ?? null;
}
