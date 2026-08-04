# Summary tab & search

What the Summary tab shows at a glance, and how search works — both the quick single-box
version and the advanced multi-filter version. This builds on the existing Summary screen
in the prototype (spending by week/month/year, by category, necessary vs. discretionary —
see `docs/ROADMAP.md`) by adding four at-a-glance stats, a search bar, and an advanced
search with saved searches.

## Summary tab — at-a-glance stats

Four things you see the moment you open the tab, plus the search bar:

**Budget spent this month** — how much of your total monthly budget you've used so far,
shown as both a dollar amount and a percent (actual spending this month vs. the sum of
your budget lines).

**Earned** — a plain running total of your real, logged income so far this period. It's
not compared against a goal or a prior period — just the number itself, decoupled from the
Budget tab entirely (the Budget tab's income field is a separate, editable-downward-only
planning figure — see `docs/BUDGET.md`). Week/Month/Year switches which period it covers.

**Invested, against your savings goals** — a ring showing this period's total Investments
contributions against the **combined total of your three savings-category budgets**
(Retirement saving + Short term savings + Savings, set on the Budget tab) — the aggregate
"savings goal." All-time contributed shown as a plain number below the ring. This is a
running total of money in (cost basis), not current market value — the app doesn't track
prices or returns; that's out of scope, and you can check that elsewhere.

**Purchase record** — every expense you've logged for whatever period you're viewing
(Week/Month/Year, including past or future periods via the ‹ › navigation), newest first,
in a scrollable list. This is a running record of what happened in that period, not just a
recent-few snapshot.

**Search bar** — a single box for quick lookups, with an "Advanced" option next to it for
combining multiple filters at once (both described below).

## Simple search (one box)

Type a word or phrase and the app suggests matches as you type (autocomplete), drawn from
three things it keeps track of:

- **Vendors** you've spent money at (e.g. "Chipotle")
- **Categories** you've created (e.g. a category you named "chips")
- **Comment text** from notes you've left on past entries (e.g. a purchase noted "chip the
  dog treat")

So typing "chip" might suggest all three — Chipotle the vendor, chips the category, and the
one purchase with "chip the dog treat" in its note — and you pick which one you meant.

What you see next depends on what you picked:

- **A vendor** → total spent all-time, this year, and this month; the date of your last
  purchase there; and a scrollable list of every purchase at that vendor.
- **A category** → total spent this month and this year; that category's share of your
  budget and what percent of it you've spent; and a scrollable list of that year's
  purchases in the category.
- **A type — necessary or discretionary** → total spent this month and this year; what
  percent of your budget is discretionary and how much of that you've spent; and a
  scrollable list of that year's purchases of that type.
- **A comment term** → the (usually short) list of purchases whose note contains that
  term, plus the total spent across them.

## Advanced search (combine filters)

*Not built yet — the app currently ships simple search only; this is Roadmap step 3.*

For when one word isn't enough — e.g. "Chipotle, but only the $50–80 purchases." Advanced
search lets you set several filters at once and only matches entries that satisfy all of
them:

- Date range
- Amount range
- Category
- Type (necessary/discretionary)
- Vendor
- A word or phrase in the comment

Any filter you leave blank is ignored — you don't have to fill in all six to search on
just two or three. Results show the matching entries plus a running total.

**Saved searches** — if you find yourself running the same combination often (e.g. "Eating
out, $50–80, this year"), you can save it with a name and re-run it later with one tap
instead of rebuilding it each time.
