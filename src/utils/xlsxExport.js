const MONEY_FMT = '$#,##0.00;[Red]-$#,##0.00';
const PERCENT_FMT = '0%';
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F7F2' } };
const SECTION_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF0E7' } };
const THIN_BORDER = { style: 'thin', color: { argb: 'FFDADDD1' } };

function sectionTitleRow(sheet, title) {
  const row = sheet.addRow([title]);
  sheet.mergeCells(row.number, 1, row.number, 6);
  row.getCell(1).font = { bold: true, size: 12 };
  row.getCell(1).fill = SECTION_FILL;
  row.height = 20;
  return row;
}

function headerRow(sheet, labels) {
  const row = sheet.addRow(labels);
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FF6B7060' } };
    cell.fill = HEADER_FILL;
    cell.border = { bottom: THIN_BORDER };
  });
  return row;
}

function moneyCell(row, col, value) {
  const cell = row.getCell(col);
  cell.value = value;
  cell.numFmt = MONEY_FMT;
  return cell;
}

function pctCell(row, col, pct) {
  const cell = row.getCell(col);
  cell.value = pct / 100;
  cell.numFmt = PERCENT_FMT;
  return cell;
}

const ENTRY_TYPE_LABEL = { expense: 'Expense', income: 'Income', investment: 'Investment' };

// `report` is the plain-number shape from buildSummaryReport(); this is the
// only place that turns it into formatted cells — the in-app preview formats
// the same numbers its own way, so the two can't drift out of sync on the math.
export async function downloadSummaryXlsx(report, { rangeLabel }) {
  // Loaded on demand — exceljs is the single largest dependency in the app,
  // and most sessions never click Download, so it shouldn't cost everyone
  // a slower first load just to be available if they do.
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Personal Finance Tracker';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Spending summary', { views: [{ state: 'frozen', ySplit: 0 }] });
  sheet.columns = [{ width: 28 }, { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 14 }];

  const titleRow = sheet.addRow([`Spending summary — ${rangeLabel}`]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 6);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.height = 24;
  sheet.addRow([]);

  // Overview
  sectionTitleRow(sheet, 'Overview');
  headerRow(sheet, ['Metric', 'Spending', 'Income', 'Net']);
  const overview = [
    ['Total', report.totalSpending, report.totalIncome, report.net],
    ['Avg / day', report.totalSpending / report.days, report.totalIncome / report.days, report.net / report.days],
    ['Avg / week', report.totalSpending / report.weeks, report.totalIncome / report.weeks, report.net / report.weeks],
    ['Avg / month', report.totalSpending / report.months, report.totalIncome / report.months, report.net / report.months],
  ];
  overview.forEach(([label, spend, income, net]) => {
    const row = sheet.addRow([label]);
    moneyCell(row, 2, spend);
    moneyCell(row, 3, income);
    moneyCell(row, 4, net);
  });
  sheet.addRow([]);

  // Spending by category — same column order as the in-app table:
  // category, avg/month, % of spend, avg/week, avg/day.
  sectionTitleRow(sheet, 'Spending by category');
  headerRow(sheet, ['Category', 'Avg / month', '% of spend', 'Avg / week', 'Avg / day']);
  report.categoryRows.forEach((c) => {
    const row = sheet.addRow([c.label]);
    moneyCell(row, 2, c.avgMonth);
    pctCell(row, 3, c.pct);
    moneyCell(row, 4, c.avgWeek);
    moneyCell(row, 5, c.avgDay);
  });
  if (report.categoryRows.length === 0) sheet.addRow(['No expenses in this range.']);
  sheet.addRow([]);

  // Income by source — same column convention as spending, for one less
  // thing to re-learn reading across the sheet.
  sectionTitleRow(sheet, 'Income by source');
  headerRow(sheet, ['Source', 'Avg / month', '% of income', 'Avg / week', 'Avg / day']);
  report.incomeRows.forEach((r) => {
    const row = sheet.addRow([r.label]);
    moneyCell(row, 2, r.avgMonth);
    pctCell(row, 3, r.pct);
    moneyCell(row, 4, r.avgWeek);
    moneyCell(row, 5, r.avgDay);
  });
  if (report.incomeRows.length === 0) sheet.addRow(['No income in this range.']);
  sheet.addRow([]);

  // Every logged entry in range, chronological — expenses, paychecks, and
  // investment contributions, same three kinds as the in-app Activity record.
  sectionTitleRow(sheet, 'Daily entries');
  headerRow(sheet, ['Date', 'Type', 'Category / Source', 'Detail', 'Purchase type', 'Amount']);
  report.entries.forEach((e) => {
    const isExpense = e.type === 'expense';
    const isIncome = e.type === 'income';
    const categoryOrSource = isExpense ? (e.category_label || 'Uncategorized')
      : isIncome ? (e.job_name || 'Uncategorized')
      : e.ticker;
    const detail = isExpense ? (e.merchant_name || '')
      : isIncome ? ''
      : [e.investment_type, e.note].filter(Boolean).join(' · ');
    const purchaseType = isExpense && e.necessary ? (e.necessary === 'necessary' ? 'Necessary' : 'Discretionary') : '';
    const amount = isExpense ? -e.amount : e.amount; // income and investment contributions both read as inflows
    const row = sheet.addRow([e.date, ENTRY_TYPE_LABEL[e.type], categoryOrSource, detail, purchaseType]);
    moneyCell(row, 6, amount);
  });
  if (report.entries.length === 0) sheet.addRow(['No entries in this range.']);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spending-summary_${report.start}_to_${report.end}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
