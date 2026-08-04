# Budget

The Budget tab is where you set the numbers everything else reads from — the spending
ring on Daily Log, the category rings and goal rings on Summary all pull from what's
entered here. Nothing on this tab tracks spending directly; it's the plan, not the log.

## Monthly income

Starts from **real income** — the total of the paychecks you've actually logged on Daily
Log this month so far. But if your paychecks don't land evenly through the month (say,
nothing at the start and a chunk on the last day), that running total can be a misleading
number to plan against early on — so you can set your own budget number instead, in either
direction.

To keep that freedom from being a blind spot, this tab also shows your **average income
over the previous 3 months** (not counting the current, still-in-progress one). If the
number you set is higher than that average, you'll see a warning — a nudge that you're
planning against more than you've typically brought in, not a hard limit. A link lets you
snap back to the real, live figure at any time.

### Calculating monthly income from a salary

If you'd rather work from an annual salary than guess a monthly number, "Calculate from
annual salary instead" opens a small calculator:

- **Annual gross income** — your salary before anything is taken out.
- **Filing status** — Single, Married Filing Jointly, Married Filing Separately, or Head
  of Household.
- **State** — used to estimate state income tax (nine states have none; you'll see $0).
- **Pre-tax deductions** *(optional)* — 401(k) contributions, health insurance, and the
  like, taken out before tax is calculated.

It shows its work — federal income tax, FICA (Social Security + Medicare), and state tax,
each subtracted step by step down to an estimated monthly take-home — then a button to use
that number as your monthly income above. This is a **planning estimate**, using the
standard deduction with no credits, itemization, or local/county taxes — not a substitute
for your actual paycheck or a tax filing. Your inputs are remembered so you don't have to
retype them next time; the tax figures themselves are for tax year 2026 (`docs/DATA_MODEL.md`
has the full sourcing note).

## Buffer

Shown at both the top and bottom of the screen: **income minus your necessary,
discretionary, and savings budgets combined.** This is what's left over once everything
else is accounted for. If it drops under $100, you'll see a warning — that's meant as an
early nudge that your budget is cutting it close against what you actually bring in, not a
hard limit.

There's no separate "earnings goal" — income and Buffer are the only figures this tab
deals with. (Summary's "Earned" stat is just your running real income total for the
period — it isn't compared against anything set here.)

## Categories

Every category has a **type**, which decides how it behaves elsewhere in the app:

- **Necessary** — needs. Logged as expenses on Daily Log.
- **Discretionary** — wants. Logged as expenses on Daily Log.
- **Savings** — money set aside, not spent. Tracked through the Investments tab instead
  of Daily Log (see below).

The app starts you off with a preset list — add your own, rename or retype any of them, or
**delete any category, preset or custom**, right from its row on this tab:

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

You can have **more than one exceptional period** at a time, and **edit or delete** any of
them later. Each one shows an informational total in the Buffer box (top and bottom of the
screen) alongside income/necessary/discretionary/savings — that figure is shown for
visibility only and isn't netted into the Buffer math itself, since whether a trip budget
replaces or adds to that week's regular category spending is a call you make case by case.
