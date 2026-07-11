# Data model

What the app remembers, in plain terms. This reflects the categories/behavior already
built in the prototype (`finance-app-latest.jsx`), plus the additions needed for
per-merchant totals and the future debt section.

## Transactions (income & expenses)

Every entry you log — an expense or a bit of income.

| Field | What it means |
|---|---|
| Date | When it happened |
| Type | `expense` or `income` |
| Amount | Dollar amount |
| Category | e.g. Groceries, Rent, Eating out (see Categories below) |
| Merchant | *New* — a tidy, reusable store/source name (see Merchants below); optional for income |
| Necessary / discretionary | Only for expenses — is this a need or a want? |
| Note | Optional free-text detail, separate from the merchant name |

Today's prototype has a single free-text "detail" field per transaction; the merchant
becomes its own tracked field so totals are reliable (see next section).

## Merchants (new)

A tidy, reusable list of where money was spent — this is what makes "Chipotle, last
month" and "Chipotle, all-time" both answerable and accurate.

| Field | What it means |
|---|---|
| Name | The normalized store name, e.g. "Chipotle" |
| First seen / last seen | Automatically tracked, for convenience |

When you type a merchant, the app suggests names you've used before (autocomplete),
so "Chipotle," "chipotle," and "CHIPOTLE " all collapse into the same entry instead of
splitting your totals across near-duplicates.

**How the two example questions get answered:**
- *"How much did I spend at Chipotle last month?"* → sum of transaction amounts where
  merchant = Chipotle and date falls in that month.
- *"How much have I spent at Chipotle, all-time?"* → sum of transaction amounts where
  merchant = Chipotle, no date filter.

Both are the same underlying query with or without a date filter — reliable because the
merchant name is consistent, not because of any special-casing.

## Categories

The existing category list from the prototype, customizable (add/rename/re-type):

- Groceries, Rent/Mortgage, Utilities, Car, Health insurance, Self maintenance, Supplies
  (all "necessary" by default)
- Eating out, Entertainment, Travel, Items/Shopping, Other (all "discretionary" by
  default)

Each category has a default necessary/discretionary type, editable per-transaction.

## Budget

Monthly budget as already modeled in the prototype:

| Field | What it means |
|---|---|
| Income mode | Monthly or annual gross salary |
| Gross income, tax rate | Used to estimate net monthly income |
| Budget lines | Named allocations (e.g. "Rent," "Savings/Investments") with a dollar amount, each optionally linked to a category for spend tracking |

The home-screen "how much have I spent in each category" view compares actual spending
(from transactions) against these budget lines for the current month.

## Manual income

Income is logged as a transaction (`type = income`) with a source (salary, freelance,
investment, gift, other) — no separate income table needed; it's the same transactions
list filtered by type.

## Investments

One row per position, as already modeled in the prototype:

| Field | What it means |
|---|---|
| Ticker / name | e.g. VOO |
| Shares | Quantity held |
| Cost per share | What you paid |
| Account type | Pre-tax (Traditional), Post-tax (Roth), or Taxable |
| Investment type | Retirement (401k/IRA), Savings, Brokerage, HSA, Other |
| Note | Optional, e.g. which brokerage/account |

This is a manual ledger of what you hold and where — not a live market-price feed (no
external service needed, keeps things free and simple).

## Retirement planning (not stored data, but derived from settings)

The retirement calculator's inputs (current age, retirement age, starting assets, monthly
contribution, expected annual return, withdrawal rate) are saved as your defaults but are
editable at any time — they drive the trajectory chart and withdrawal projections. These
are assumptions, not transactions; changing them recalculates the projection, it doesn't
rewrite history.

## Debt (placeholder — not built yet)

A future tab for tracking debts (credit cards, loans, etc.) and a payoff plan. Deferred
per the roadmap (`docs/ROADMAP.md`) — noted here so the data model has an obvious place
to grow into once designed.

## Readable spreadsheet export (on-demand only)

When you use the "Export" feature (see `docs/SECURITY.md` for why this is the one
unencrypted output), it produces a readable table — one row per transaction (or per
investment, in a separate sheet/tab) — mirroring the fields above. It's a snapshot for
viewing, not a second copy the app treats as a source of truth.
