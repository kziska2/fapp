# Security & privacy design

This app stores sensitive financial data, so the privacy design isn't a bolt-on feature —
it's the reason several other decisions (storage format, sync method, even who's allowed
to see what during development) look the way they do. This doc explains the design in
plain terms, then states the rules that follow from it.

## The core guarantee

**Nobody but you can read your data — not Google, not an attacker who steals the file,
and not Claude.** This holds because the data is locked *before* it's ever written to
disk or sent anywhere, using a key that only exists on your device and only when you've
entered your passphrase.

## How the locking works

1. **You choose a passphrase.** Pick something you can remember — this is the one secret
   that protects everything.
2. **The device turns your passphrase into a secret key**, using a method called
   **Argon2id**. This method is deliberately slow and memory-intensive, which makes it
   very hard for someone to guess your passphrase by brute force, even if they steal the
   locked file. The passphrase itself is never stored — only used, in the moment, to
   produce the key.
3. **Your data (the SQLite database) is compressed, then encrypted** with that key using
   **AES-256-GCM** — a standard, widely-trusted encryption method (the same family used
   to protect bank and government data). The result is one file of unreadable bytes.
4. **That locked file is what gets stored, backed up, and uploaded to Google Drive.**
   Compression happens first purely to keep the file small; encryption is what makes it
   unreadable.
5. **Unlocking happens only in memory, only on your device, only after you enter your
   passphrase.** The unlocked data is never written back to disk in readable form, and
   it's never transmitted anywhere.

## What each party can and cannot see

| Party | Can see | Cannot see |
|---|---|---|
| You (with your passphrase) | Everything, inside the app | — |
| Google (hosting the Drive file) | A file of encrypted bytes, its size, and when it changed | Any transaction, balance, category, or amount |
| Someone who steals your phone/laptop | The locked file on disk (useless without your passphrase) | Your data, unless they also have your passphrase |
| Someone who steals your Google account | The locked file (same as above) | Your data — the passphrase is separate from your Google password and never stored with Drive |
| Claude (during development) | Only synthetic/fake data, by policy — see below | Your real data, ever |

## The passphrase trade-off

Because the passphrase is the *only* key, and it's never stored anywhere (not even in a
recoverable/hashed form Google or the app could use to reset it for you):

- **If you forget your passphrase, the data cannot be recovered.** This isn't a missing
  feature — a recovery path would mean *someone* (us, Google, or an attacker who
  compromises that recovery path) could unlock your data without your passphrase, which
  defeats the point.
- This is worth writing down somewhere safe (a password manager, not a sticky note on the
  laptop) precisely because there's no "forgot password" button that actually works here.

## What "only ever ciphertext leaves the device" means for sync

The Google Drive sync path only ever transmits the **locked** file — the same file that
sits on your device. There is no step where the app sends your passphrase, your derived
key, or unlocked data to Google, to any other server, or to Claude. The on-demand
spreadsheet export is the one deliberate exception, and it's covered next.

## The one intentional exception: on-demand spreadsheet export

You can choose to export a **readable** spreadsheet/CSV of your data (e.g., to glance at
in Google Sheets). This is different from everything above:

- It only happens when you explicitly trigger it.
- The exported file is *not* encrypted — it's meant to be human-readable.
- It is your responsibility once created (where you save it, who else can access it) —
  the app's guarantees apply to its own locked storage, not to a file you've deliberately
  exported in readable form.

## Rules for development (binding on Claude, every session)

1. Never request, accept, log, or store real financial data. Use `docs/SYNTHETIC_DATA.md`
   fixtures for everything — screenshots, test data, debugging.
2. Never write code that transmits the passphrase, a derived key, or unlocked data off
   the device — to a server, an error/log reporting service, or anywhere else.
3. Never add a "backdoor," master key, password-reset flow, or any other mechanism that
   would let data be unlocked without the user's passphrase. If a task seems to call for
   this, stop and ask the user rather than implementing a workaround.
4. Treat any real-looking financial data encountered during a session (real balances,
   real names tied to real numbers) as a red flag to raise with the user, not a fixture to
   use.
5. Keep encryption code (Argon2id parameters, AES-GCM usage, nonce handling) using
   well-reviewed standard libraries — do not hand-roll cryptographic primitives.
6. Manual backup files, exported spreadsheets, and any file that could contain real data
   must never be committed to the repository (`.gitignore` is a backstop, not a
   substitute for checking `git status` before committing).
