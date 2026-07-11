# Synthetic data for development

Per `CLAUDE.md` and `docs/SECURITY.md`, real financial data is never used during
development — including for screenshots, debugging, or manual testing. This doc describes
the fake-but-realistic data used instead.

## Approach

A small generator script (to be added under e.g. `scripts/generate-fixtures.*` once the
project is scaffolded) produces a plausible year or two of made-up financial activity:

- **Transactions** — a mix of recurring expenses (rent, utilities, groceries) and
  irregular ones (eating out, entertainment, shopping), spread across months, using
  invented merchant names (e.g. "Riverside Grocery," "Corner Burrito Co.," "Metro Transit")
  deliberately *not* copied from the user's real spending habits.
- **Income** — a couple of recurring salary entries plus occasional freelance/gift income.
- **Investments** — a handful of fake positions across account types (e.g. a made-up
  ticker or two, round share counts, round costs).
- **Budget** — a filled-in example budget with realistic-looking but invented numbers.
- **Retirement settings** — reasonable example assumptions (age, contribution, return
  rate) distinct from any real personal figures.

## Rules

1. Fixture data must be clearly fictional in its *specifics* (invented merchant/company
   names) even though the *shape* (categories, amount ranges, frequency) should resemble
   real usage closely enough to be useful for testing summaries, charts, and budget
   tracking.
2. Fixtures live in the repo (or are generated on demand) and are always safe to commit —
   never derived from or seeded by anything the user has shared about their actual
   finances.
3. When demonstrating a feature to the user (e.g., a screenshot of the retirement chart),
   use this synthetic data, not a placeholder that quietly encourages entering real
   numbers "just to see."
4. If the user pastes or describes real numbers during a session for context, don't fold
   them into fixtures — treat them as information about intent (e.g., "make sure amounts
   can go into the thousands") rather than literal values to reuse.
