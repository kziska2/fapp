# Roadmap

## Where things stand today

The real app is scaffolded and running (Vite + React + PWA), replacing the original
Claude-artifact prototype (`finance-app-latest.jsx`, kept around as a reference). Data is
encrypted on-device (Argon2id + AES-256-GCM, an in-browser SQLite database via `sql.js`)
and persisted locally — no cloud sync yet. Deployed and installable today at
`https://kziska2.github.io/fapp/`.

All six tabs work:

- **Daily log** — expense/paycheck entry, spending ring, monthly log
- **Budget** — real-income-based budgeting, Buffer, necessary/discretionary/savings
  category lists (add/edit/delete), exceptional-period budgets (add/edit/delete)
- **Summary** — week/month/year stats, category rings, Earned/Invested, simple search
- **Investments** — position ledger, savings-goal progress rings
- **Retirement** — calculator with a Chart.js trajectory visualization
- **Categories** (settings) — add/rename/retype/remove categories, three-way typed

What's still missing: Google Drive as the permanent home (data currently only lives on
this device), advanced/saved search, on-demand spreadsheet export, and the debt section.

## Build order

1. ~~**Real installable app + encrypted local storage.**~~ **Done.** Scaffolded (React +
   Vite + PWA), all six screens migrated in, in-app SQLite database, and the lock/unlock
   layer (passphrase → Argon2id → AES-256-GCM) — the app runs standalone, offline, with
   data encrypted on-device, deployed to GitHub Pages.

2. **Google Drive as the primary home.** Add sign-in, and upload/download of the locked
   file to/from the user's Drive app-data folder. Verify the "new device" flow: install →
   sign in → enter passphrase → continue where you left off. Manual locked backup/export
   as a secondary safety net.

3. **Tidy merchant names + search.** Simple search (vendor/category/note-text lookup) is
   **done**. Still to build: merchant-field autocomplete beyond a plain `<datalist>`,
   advanced search (combine date, amount, category, type, merchant, and note filters), and
   saved searches. Full spec: `docs/SUMMARY_AND_SEARCH.md`.

4. ~~**Daily log, budget, & richer summaries.**~~ **Done** — real implementations of the
   Daily Log and Budget tabs (per-category monthly budgets across
   necessary/discretionary/savings types, real income with a Buffer figure, and a
   custom date-range budget override for exceptional periods), plus Summary's
   at-a-glance stats (budget spent this month, earned, invested against the combined
   savings goal, last three purchases). The Investments `Investment type` field is
   re-aligned to map 1:1 to the three savings-type Budget categories. Full specs:
   `docs/DAILY_LOG.md`, `docs/BUDGET.md`, `docs/SUMMARY_AND_SEARCH.md`.

5. **On-demand readable spreadsheet export.** The one intentional unencrypted output,
   built last since it's an add-on, not core functionality.

6. **Debt payoff section (later).** Deliberately deferred — will be scoped and designed
   in a future planning pass once the rest of the app is solid.

## Notes

- Each step should leave the app in a working, testable state — no long stretches of
  broken intermediate states.
- Development and testing use synthetic data throughout (`docs/SYNTHETIC_DATA.md`); no
  real financial data should be needed until the user starts using the finished app
  themselves.
