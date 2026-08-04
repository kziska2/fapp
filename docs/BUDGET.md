# Budget

The Budget tab is where you set the numbers everything else reads from — the spending
ring on Daily Log, the category rings and goal rings on Summary all pull from what's
entered here. Nothing on this tab tracks spending directly; it's the plan, not the log.

## Monthly income

A **planning estimate** — a number you type in to size your budget against (e.g. "I plan
around $4,500 a month"). It's kept separate from paycheck logging on Daily Log and is
never shown anywhere as "earned" — it exists only to help divide your budget across
categories.

Once you've logged a full month of real paychecks, the app can **suggest switching** this
figure to a calculated one (an average of your recent real paychecks). That's a suggestion
you choose to accept, not something that happens automatically — you can keep typing your
own estimate indefinitely if you'd rather.

## Earnings goal

A separate figure from the income estimate above — this one is meant to be **ambitious**.
It's what your actual earned-to-date (from real logged paychecks) is compared against on
the Summary tab's earnings ring. Where the income estimate is practical ("this is roughly
what I bring in, so I can plan a budget"), the earnings goal is aspirational ("this is
what I'm reaching for") — it can be higher than the income estimate, and often should be.

## Categories

Every category has a **type**, which decides how it behaves elsewhere in the app:

- **Necessary** — needs. Logged as expenses on Daily Log.
- **Discretionary** — wants. Logged as expenses on Daily Log.
- **Savings** — money set aside, not spent. Tracked through the Investments tab instead
  of Daily Log (see below).

The app starts you off with a preset list — add your own, rename or retype any of them,
or remove ones you don't need:

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
| Debts | Necessary | Payments toward debt |
| Education | Necessary | Tuition, courses, books |
| Giving | Discretionary | Gifts and charity |
| Retirement saving | Savings | Retirement contributions |
| Short term savings | Savings | Near-term set-aside, e.g. an emergency fund |
| Savings | Savings | Set-aside for a big purchase — a house, a car |

**Debts** is a plain expense category for now — budget it and track spending against it
like any other necessary category. A dedicated debt payoff tab (balances, interest rates,
a payoff plan) is on the roadmap as later, separate work; this category is the intentional
hook it'll eventually connect to, not a stand-in for that whole feature now.

## Setting a budget per category

You describe a budget **by month** — that's the base unit. A week and a year are both
shown automatically from your monthly figure:

- **Week** ≈ month ÷ 4.3
- **Year** = month × 12

You don't enter these separately; they're derived so that switching the Week/Month/Year
view on Summary always adds up consistently.

### Savings categories work differently

For Retirement saving, Short term savings, and Savings, the monthly amount you set here
**is** the goal — there's no separate expense entry to log. Instead, progress is
calculated from what you log on the Investments tab, matched by investment type:

| Budget category | Matches Investments entries of type |
|---|---|
| Retirement saving | Retirement (401k/IRA) |
| Short term savings | Short-term savings |
| Savings | Big-purchase savings |

(Investments entries logged as Brokerage, HSA, or Other aren't tied to a specific Budget
savings goal — they're tracked, just not measured against a target here.)

## Custom budget for an exceptional period

Most weeks just use the derived fraction of your monthly budget. But for something like a
vacation, you can set a **custom budget for a specific date range** — pick a start and end
date (it doesn't have to line up with a calendar week) and enter one total budget for that
whole span. While that range is active, it replaces the derived weekly figure; before and
after, your budget goes back to the normal monthly-derived amount.
