# Personal Finance PWA

A private, installable personal finance app for one user (you). It handles manual
income/expense logging, a monthly budget, category and merchant spending summaries,
investment tracking, and a retirement contribution/trajectory planner with a visualization.
A debt payoff tab is planned but not yet built (see `docs/ROADMAP.md`).

This app exists because the data in it is sensitive — every design decision here is
downstream of protecting that data, even from us.

## Hard privacy rules (read this first)

These rules are not suggestions. They apply to every session, every branch, every "just
for testing" moment.

1. **Never handle, request, log, or store real financial data in this project.** All
   development, examples, screenshots, and test fixtures use **synthetic data only** — see
   `docs/SYNTHETIC_DATA.md` for the generator and sample set to use.
2. **Never commit real data, backup files, or exported spreadsheets.** `.gitignore` blocks
   the known file patterns, but treat that as a backstop, not a guarantee — check `git
   status` / `git diff` before committing anything that touches storage, export, or sync
   code.
3. **Never weaken the encryption, add a "recovery" backdoor, or send the passphrase (or
   any key derived from it) anywhere off-device** — not to a server, not to a log, not to
   an error-reporting tool, not to Claude. If a task seems to require this, stop and ask
   the user instead of finding a workaround.
4. **The only thing that ever leaves the device unlocked is a user-initiated readable
   export** (the on-demand spreadsheet export feature). Automatic sync (Google Drive)
   always uploads the locked/encrypted file, never plaintext.
5. **If you (Claude) are ever shown what looks like real financial data** — real account
   numbers, real balances, a real name tied to real transactions — stop and flag it to the
   user rather than proceeding as if it were a fixture.

See `docs/SECURITY.md` for the full design and reasoning.

## What this app is

- A **PWA** (installable, works offline) for one user's personal finances.
- Data's permanent home is a **single locked file in the user's own Google Drive**,
  cached locally per device. See `docs/ARCHITECTURE.md`.
- Storage under the hood is **SQLite**, compressed and encrypted before it ever touches
  disk or leaves the device. See `docs/DATA_MODEL.md`.
- Built from an existing prototype: `finance-app-latest.jsx` (a single-file React
  component originally built as a Claude artifact). It has working UI for daily
  logging, budget, summary, investments, and retirement planning — the build work is
  about giving it real (encrypted, durable) storage and packaging it as an installable
  app, not rewriting the UI from scratch.

## Tech stack (and why)

| Piece | Choice | Why |
|---|---|---|
| UI | React + Vite | The existing prototype is already React; Vite gives fast local dev and a simple static build. |
| Installable/offline | PWA (manifest + service worker) | Free, works on phone and desktop, no app store. |
| Local database | SQLite compiled to WASM, run in-browser | Real SQL for questions like "Chipotle, all time" without a backend. |
| Encryption | Web Crypto API (AES-256-GCM) + Argon2id for key derivation | Both are free, well-audited, and native/standard — no paid crypto service. |
| Cloud storage | Google Drive (user's own account, app-data scope) | Free, durable, already-trusted by the user, and only ever holds the encrypted file. |
| Hosting | Static host (Cloudflare Pages / Netlify / GitHub Pages) | The app is fully self-contained client-side code; no backend to run or pay for. |

Full detail and diagrams: `docs/ARCHITECTURE.md`.

## Working with this codebase

- The user is **not a software engineer**. Explanations, commit messages aimed at them,
  and any docs updates should avoid unexplained jargon — say "locked file" not "encrypted
  blob," "sign in to Drive" not "OAuth flow," etc. Technical precision still matters in
  code and in docs meant for future-Claude; it's plain language specifically in
  user-facing explanations.
- Prefer extending the existing prototype's component structure over rewriting it. The
  UI/UX in `finance-app-latest.jsx` reflects real design decisions (categories,
  necessary/discretionary split, budget lines, retirement chart) — preserve that behavior
  when migrating it into the real project structure.
- No comments explaining *what* code does. Comments only for non-obvious *why* — especially
  around crypto/key-handling code, where a future reader needs to know the constraint being
  worked around, not what the API call does.

## Commands

_To be filled in once the project is scaffolded (package.json, build tooling, test
runner). Placeholder — do not assume `npm run dev` etc. exist yet without checking._

## Related docs

- `docs/ARCHITECTURE.md` — how the pieces fit together
- `docs/SECURITY.md` — the encryption/privacy design in full
- `docs/DATA_MODEL.md` — what data is tracked and how queries like per-merchant totals work
- `docs/ROADMAP.md` — build order
- `docs/SYNTHETIC_DATA.md` — fake data for development
