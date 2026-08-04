# Daily log

The tab the app opens to. It's built for fast, low-friction logging — every time you
open the app, this is what you see, so logging a purchase or a paycheck takes a few
seconds, not a few taps through menus.

Layout, top to bottom: a compact entry form, a spending snapshot, then a big running
list of everything you've logged.

## Logging an expense

Required:
- **Amount**
- **Category** (see the category list in `docs/BUDGET.md`)

Auto-filled, but editable:
- **Necessary or discretionary** — defaults from the category's type (e.g. Groceries
  defaults to necessary, Eating out defaults to discretionary), but you can flip it for
  a one-off case (a necessary category can have a discretionary purchase and vice versa).
- **Date** — defaults to today.

Optional:
- **Detail** — free-text, e.g. "Corner Burrito Co." or a note to yourself.

One tap adds the entry and clears the form for the next one.

Savings-type categories (Retirement saving, Short term savings, Savings) don't show up
here — those are tracked through the Investments tab instead. See `docs/BUDGET.md` for
why.

## Logging a paycheck

A separate small action on the same tab, not mixed into the expense form. Capture:

- **Job** — a reusable named list, the same way merchants work: pick one you've used
  before or add a new one.
- **Amount received**
- **Date received**

This is only ever for money that's actually landed in your bank — never an estimate, a
projection, or your general salary. Logging each paycheck as it arrives is meant to be a
habit: you check the deposit, log it, done. There's nowhere in the app to enter expected
or projected income.

## The running list

The dominant element on the screen — your past entries, newest first, grouped by day.
Each row shows the category (and detail, if you added one), the necessary/discretionary
chip in that category's color, and the amount. Expenses and paychecks appear in the same
list, income shown as a positive amount, expenses as negative. Tap the trash icon to
delete an entry, or tap anywhere else on the row to open it for editing — every field you
filled in when you logged it can be changed later, which is handy for adding a detail you
skipped in the moment.

## Spending snapshot

Right below the entry form, before the running list:

- A **ring** showing this month's spending against your total monthly budget (set on the
  Budget tab). If you go over, a second smaller ring appears showing the overage in both
  dollars and percent — e.g. a $500 budget with $600 spent shows a full first ring plus a
  second ring reading "$100 · 20% over."
- **Received this month** — a plain number, the total of paychecks logged this month.
- **Monthly balance** — received minus spent, shown as its own figure so you can see at
  a glance whether the month is net positive or negative.
