# Data model

What the app remembers, in plain terms. This reflects the categories/behavior already
built in the prototype (`finance-app-latest.jsx`), plus the additions needed for search
(merchants, categories, note text, saved searches), the Summary tab's at-a-glance stats,
and the future debt section.

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

**Savings-type categories never appear here.** Retirement saving, Short term savings, and
Savings (see Categories below) aren't logged as transactions at all — they're tracked
through the Investments table instead. See `docs/BUDGET.md` for why.

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

## Jobs / income sources (new)

A tidy, reusable list of where your paychecks come from — parallel to Merchants, but for
income instead of spending.

| Field | What it means |
|---|---|
| Name | The job or income source, e.g. "Riverside Design Co." |
| First seen / last seen | Automatically tracked, for convenience |

When logging a paycheck on Daily Log, you pick a job you've used before (autocomplete) or
add a new one — the same pick-or-add pattern as Merchants.

## Search

Full behavior (the Summary tab's search bar and advanced search) is described in
`docs/SUMMARY_AND_SEARCH.md`. What that feature needs from the data model:

- The **merchant list** above, kept tidy via autocomplete.
- A running, de-duplicated list of **categories** (already tracked — see Categories
  below) — searchable the same way as merchants.
- The **note** field on each transaction, indexed so a typed word or phrase can find
  every entry whose note contains it.

Typing a term checks it against all three at once (merchant names, category names, and
note text) and suggests matches from whichever it finds — that's what powers the "type
'chip,' see Chipotle, a 'chips' category, and a note mentioning chips" behavior.

Advanced search combines several of these at once — date range, amount range, category,
type, merchant, note text — plus:

| Field | What it means |
|---|---|
| Saved searches | A name you give a set of filters, so it can be re-run with one tap instead of rebuilt each time |

## Categories

Every category has a **type**: necessary, discretionary, or savings. Necessary and
discretionary categories are logged as expenses on Daily Log, with the type editable
per-transaction. Savings-type categories are never logged as expenses — see "Savings
categories" under Budget, below.

Customizable (add/rename/retype/remove) — the app starts with this preset list:

| Category | Type | Covers |
|---|---|---|
| Rent | Necessary | Rent or mortgage |
| Utilities | Necessary | Gas, electric, wifi, phone bill |
| Transportation | Necessary | Car insurance, gas, maintenance, train, bus |
| Groceries | Necessary | Food and household shopping |
| Eating out / order in | Discretionary | Restaurants, takeout, delivery |
| Health | Necessary | Insurance, gym membership, dental, medications, therapy |
| Dependents | Necessary | Pets, child care, family or anyone you support |
| Supplies | Necessary | Toilet paper, cleaning supplies, shampoo, haircuts, household items |
| Fun | Discretionary | Life-enriching spending — vacations, hobbies |
| Entertainment | Discretionary | Movies, streaming, show tickets, shopping |
| Debts | Necessary | Payments toward debt (forward hook to the future debt tab — see `docs/ROADMAP.md`) |
| Education | Necessary | Tuition, courses, books |
| Giving | Discretionary | Gifts and charity |
| Retirement saving | Savings | Retirement contributions — tracked via Investments |
| Short term savings | Savings | Near-term set-aside, e.g. an emergency fund — via Investments |
| Savings | Savings | Set-aside for a big purchase — a house, a car — via Investments |

Full behavior lives in `docs/BUDGET.md`.

## Budget

Set on the Budget tab; everything else (Daily Log's spending ring, Summary's rings)
reads from this. Full plain-language behavior in `docs/BUDGET.md`.

| Field | What it means |
|---|---|
| Monthly income estimate | A planning figure you type in to size your budget — separate from real paycheck logging. Can later be switched to a calculated figure once a month of real paychecks exists. |
| Earnings goal | A separate, deliberately ambitious figure — what actual earned-to-date is compared against on Summary. Not used to size the budget. |
| Budget lines | One per category, a monthly dollar amount. Month is the base unit — week (÷4.3) and year (×12) are derived, not entered separately. |
| Custom period override | An optional start date, end date, and one total budget for that span (e.g. a vacation) — supersedes the derived weekly figure for those days. |

**Savings categories work differently.** For Retirement saving, Short term savings, and
Savings, the monthly amount set here *is* the goal — there's no expense entry. Progress
is calculated from the Investments table instead, matched by investment type (see
Investments, below, for the mapping).

## Manual income

Income is logged as a transaction (`type = income`) — no separate income table needed;
it's the same transactions list filtered by type. Each entry carries a **job/income
source** (from the reusable Jobs list above), an **amount received**, and a **date
received**.

**Every income entry is a real, already-landed deposit.** There is no field anywhere for
expected, projected, or standing-salary income — logging a paycheck as it lands is meant
to build the habit of checking each deposit. The Budget tab's income estimate and
earnings goal (see Budget, above) are separate, planning-only figures — they're never
populated from or confused with real income entries.

## Investments

One row per position, as already modeled in the prototype:

| Field | What it means |
|---|---|
| Date | *New* — when this contribution was made, so "this year vs. all-time" can be split out |
| Ticker / name | e.g. VOO |
| Shares | Quantity held |
| Cost per share | What you paid |
| Account type | Pre-tax (Traditional), Post-tax (Roth), or Taxable |
| Investment type | Retirement (401k/IRA), Short-term savings, Big-purchase savings, Brokerage, HSA, Other |
| Note | Optional, e.g. which brokerage/account |

This is a manual ledger of what you hold and where — not a live market-price feed (no
external service needed, keeps things free and simple). The Summary tab's "invested"
stat (see `docs/SUMMARY_AND_SEARCH.md`) sums cost (shares × cost per share) across
positions — this period's (filtered by the Date field) and all-time (no date filter)
— using cost basis only; it doesn't need a market-value/price field, since it's about
money put in, not what it's grown or shrunk to.

**Investment type maps directly to the three savings-type Budget categories** (see
Categories and Budget, above), so progress against a savings goal can be calculated
without any extra linking field:

| Investment type | Matches Budget category |
|---|---|
| Retirement (401k/IRA) | Retirement saving |
| Short-term savings | Short term savings |
| Big-purchase savings | Savings |

Brokerage, HSA, and Other are tracked here but aren't measured against a specific Budget
savings goal.

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
