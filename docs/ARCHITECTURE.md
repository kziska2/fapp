# Architecture

This describes how the app's pieces fit together. It's written to be understandable
without an engineering background — see `docs/SECURITY.md` for the deeper "why is this
safe" explanation.

## The big picture

```
┌─────────────────────────────────────────────────────────────────┐
│  Your device (phone or computer)                                 │
│                                                                    │
│   ┌────────────┐     ┌──────────────┐     ┌────────────────┐    │
│   │  The app   │────▶│  In-app      │────▶│  Lock / unlock  │    │
│   │  (screens  │     │  database    │     │  layer          │    │
│   │  you use)  │◀────│  (SQLite)    │◀────│  (passphrase)   │    │
│   └────────────┘     └──────────────┘     └────────┬────────┘    │
│                                                       │            │
│                                            locked file (cached)   │
└───────────────────────────────────────────────────────┼──────────┘
                                                          │
                                          upload / download (locked only)
                                                          │
                                                          ▼
                                          ┌───────────────────────────┐
                                          │   Your Google Drive        │
                                          │   (one locked file,        │
                                          │   permanent home of the    │
                                          │   data — survives a        │
                                          │   lost or replaced device) │
                                          └───────────────────────────┘
```

Optional, separate path — only when you press the button:

```
In-app database ──(you click "Export")──▶ readable spreadsheet (.csv / Google Sheet)
```

## The pieces, in plain terms

**The app (screens you use)**
An installable web app (a PWA) — install it like an app on your phone or computer, and
it also works offline. This is the layer you actually interact with: entering a
transaction, viewing your budget, looking at the retirement chart, and so on. Built from
the existing prototype (`finance-app-latest.jsx`), restructured into a proper project.

**The in-app database**
A small database (SQLite) that lives *inside* the app itself — no separate server. It's
what makes questions like "how much have I spent at Chipotle, ever?" or "what did I
spend on discretionary stuff in March?" fast and reliable, because it's a real
query instead of scanning through everything by hand. See `docs/DATA_MODEL.md` for what's
in it.

**The lock/unlock layer**
Before the database is ever saved anywhere — on your device, or especially before it
goes to Google Drive — it's compressed and then locked with a key derived from your
passphrase. Nothing is stored unlocked. Full detail: `docs/SECURITY.md`.

**Your Google Drive (the permanent home)**
The locked file's primary home is your own Google Drive, stored in a hidden per-app
folder (Drive's "app data" area — it won't show up cluttering your regular files). This
is what makes the app durable over years and across devices: if your laptop dies or you
get a new phone, the data isn't gone. A cached copy also lives on each device you use, so
the app works offline and syncs the next time you're online.

**New device, continuing where you left off**
Install the app on the new device → sign in to the same Google account → enter your
passphrase → the locked file downloads and unlocks → you're exactly where you left off.
No manual file transfer required (though manual locked backups remain available too, as
a second safety net).

**The readable spreadsheet export (optional, on demand)**
A separate, deliberate action: pressing "Export" creates a normal, readable
spreadsheet/CSV copy of your data — useful for glancing at things in Google Sheets or
sharing a snapshot. This copy is *not* locked (it's meant to be human-readable), and it
only ever exists when you choose to create it. It has no effect on how the app stores
data day-to-day.

## Migrating the prototype

The current prototype (`finance-app-latest.jsx`) was built inside a Claude "artifact" and
depends on a few artifact-only conveniences that won't exist in a standalone app:

- `window.storage` (an artifact-provided key/value store) → replaced by the local SQLite
  database + lock/unlock layer described above.
- Claude's theme CSS variables (`var(--color-...)`) → replaced with the app's own
  stylesheet/theme, kept visually consistent with the prototype.
- Chart.js loaded from a CDN at runtime → bundled as a real dependency so the app works
  offline (a PWA can't depend on fetching a script from the internet every time).

The screens and logic (categories, budget lines, necessary/discretionary split,
retirement math, the Chart.js line chart) are the parts worth keeping — this is a storage
and packaging migration, not a UI rewrite.

## Project structure (once scaffolded)

```
fapp/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── DATA_MODEL.md
│   ├── ROADMAP.md
│   └── SYNTHETIC_DATA.md
├── src/
│   ├── app/            # screens (daily log, budget, summary, investments, retirement, debt-later)
│   ├── storage/         # SQLite access, schema, queries
│   ├── crypto/          # lock/unlock (Argon2id + AES-256-GCM)
│   ├── sync/            # Google Drive upload/download
│   └── export/          # readable spreadsheet export
├── public/               # PWA manifest, icons, service worker
└── finance-app-latest.jsx   # original prototype (reference during migration)
```

This structure is a starting proposal, not fixed — expect it to adjust once real build
tooling is chosen and set up.
