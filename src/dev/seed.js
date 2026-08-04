import { listCategories } from '../storage/queries/categories.js';
import { setBudgetAmount } from '../storage/queries/budget.js';
import { addExpense, addIncome } from '../storage/queries/transactions.js';
import { addInvestment } from '../storage/queries/investments.js';

// Dev-only convenience so screens can be exercised without hand-typing data —
// invented merchant/company names and round numbers only, per
// docs/SYNTHETIC_DATA.md. Never wired into the production build: only
// imported from a button gated behind import.meta.env.DEV (see App.jsx).
const BUDGETS = {
  Rent: 950, Utilities: 150, Transportation: 180, Groceries: 350, Health: 120,
  Dependents: 60, Supplies: 40, Debts: 100, Education: 25,
  'Eating out / order in': 400, Fun: 90, Entertainment: 60, Giving: 30,
  'Retirement saving': 300, 'Short term savings': 100, Savings: 100,
};

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function seedSyntheticData(db) {
  const categories = listCategories(db);
  categories.forEach((c) => {
    if (BUDGETS[c.label] !== undefined) setBudgetAmount(db, c.id, BUDGETS[c.label]);
  });

  const byLabel = Object.fromEntries(categories.map((c) => [c.label, c]));
  const expense = (label, amount, merchant, daysBack) => {
    const cat = byLabel[label];
    if (!cat) return;
    addExpense(db, { date: daysAgo(daysBack), amount, categoryId: cat.id, necessary: cat.type, merchantName: merchant });
  };

  expense('Rent', 950, 'Riverside Apartments', 20);
  expense('Utilities', 118.4, 'Metro Power & Light', 18);
  expense('Groceries', 62.1, 'Riverside Grocery', 3);
  expense('Groceries', 58.3, 'Riverside Grocery', 12);
  expense('Eating out / order in', 14.75, 'Corner Burrito Co.', 1);
  expense('Eating out / order in', 11.85, 'Chipotle', 5);
  expense('Eating out / order in', 16.2, 'Corner Burrito Co.', 9);
  expense('Transportation', 45, 'Metro Transit', 6);
  expense('Fun', 32, 'Riverside Cinema', 8);
  expense('Entertainment', 15.99, 'StreamFlix', 2);
  expense('Health', 25, 'Corner Pharmacy', 14);
  expense('Supplies', 22.4, 'Home Basics', 11);
  expense('Giving', 30, 'Local Food Bank', 16);

  addIncome(db, { date: daysAgo(4), amount: 1842.3, jobName: 'Riverside Design Co.' });
  addIncome(db, { date: daysAgo(18), amount: 620, jobName: 'Freelance — Acme Corp' });

  addInvestment(db, { date: daysAgo(10), ticker: 'VOO', shares: 2.5, costPerShare: 520, accountType: 'Post-tax (Roth)', investmentType: 'Retirement (401k/IRA)', note: 'Roth IRA contribution' });
  addInvestment(db, { date: daysAgo(14), ticker: 'VTI', shares: 1.8, costPerShare: 265, accountType: 'Taxable', investmentType: 'Short-term savings', note: 'Emergency fund top-up' });
  addInvestment(db, { date: daysAgo(30), ticker: 'BND', shares: 5, costPerShare: 72.5, accountType: 'Taxable', investmentType: 'Big-purchase savings', note: 'House fund' });
  addInvestment(db, { date: daysAgo(45), ticker: 'AAPL', shares: 3, costPerShare: 195, accountType: 'Taxable', investmentType: 'Brokerage', note: '' });
}
