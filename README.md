# Personal Finance PWA

A private, installable app for tracking your own finances: manual income/expense
logging, a monthly budget, spending summaries (by category, by store, by time period), an
investment ledger, and a retirement contribution/trajectory planner with a chart. A debt
payoff tab is planned for later.

Your data is locked on your device before it's ever saved or backed up. Its permanent
home is a single locked file in your own Google Drive, so it survives a lost device and
follows you to a new one — you just sign in and enter your passphrase. Nobody else,
including Google and Claude, can read it.

## Status

This project currently contains a working prototype (`finance-app-latest.jsx`) and a set
of architecture/planning docs. The app itself hasn't been scaffolded yet.

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — guide for working on this project (privacy rules, stack,
  conventions)
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the pieces fit together
- [`docs/SECURITY.md`](./docs/SECURITY.md) — the privacy/encryption design, explained
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — what the app tracks
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — build order
- [`docs/SYNTHETIC_DATA.md`](./docs/SYNTHETIC_DATA.md) — fake data used during development
