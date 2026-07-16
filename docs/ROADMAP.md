# Roadmap

## Where things stand today

The prototype (`finance-app-latest.jsx`) already has working screens for:

- **Daily log** — add income/expense entries, see a running monthly log, and a
  budget-progress preview
- **Budget** — set income and monthly allocations, see a spend-down tracker per category
- **Summary** — spending by week/month/year, by category, necessary vs. discretionary
- **Investments** — add positions with account/investment type, see totals
- **Retirement** — calculator with adjustable assumptions and a Chart.js trajectory
  visualization
- **Categories** (settings) — customize expense categories

What's missing before this is a real, private, durable app: encrypted storage, Google
Drive as the permanent home, installability (PWA), reliable per-merchant totals, and a
debt section.

## Build order

1. **Real installable app + encrypted local storage.** Scaffold the project (React +
   Vite + PWA), migrate the prototype's screens in, add the in-app SQLite database, and
   the lock/unlock layer (passphrase → Argon2id → AES-256-GCM). At the end of this step,
   the app runs standalone, offline, with data encrypted on-device — before any cloud
   sync exists.

2. **Google Drive as the primary home.** Add sign-in, and upload/download of the locked
   file to/from the user's Drive app-data folder. Verify the "new device" flow: install →
   sign in → enter passphrase → continue where you left off. Manual locked backup/export
   as a secondary safety net.

3. **Tidy merchant names + search.** Add the merchant field with autocomplete
   (replacing/augmenting today's free-text detail field), and build the smart search bar
   (vendor, category, or note-text lookup with live autocomplete) plus advanced search
   (combine date, amount, category, type, merchant, and note filters) and saved searches.
   Full spec: `docs/SUMMARY_AND_SEARCH.md`.

4. **Manual income & richer summaries.** Make sure income entry is well-supported
   (already partially there) and extend the summary screen with the drill-downs described
   in the original request, plus the new at-a-glance stats: budget spent this month,
   earned this year with an on-track indicator, invested (this year + all-time
   contributions), and last three purchases. Full spec: `docs/SUMMARY_AND_SEARCH.md`.

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
