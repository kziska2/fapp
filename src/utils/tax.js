import { FEDERAL_BRACKETS_2026, FEDERAL_STANDARD_DEDUCTION_2026, FICA_2026, stateTaxInfo, STATE_NAMES } from '../data/taxTables2026.js';

export const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'marriedFilingJointly', label: 'Married filing jointly' },
  { value: 'marriedFilingSeparately', label: 'Married filing separately' },
  { value: 'headOfHousehold', label: 'Head of household' },
];

export const STATE_OPTIONS = Object.entries(STATE_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// `pairs` is [[thresholdStart, rate], ...] ascending — each rate applies only to the
// slice of income between its threshold and the next one (or infinity, for the last).
function marginalTax(income, pairs) {
  let tax = 0;
  for (let i = 0; i < pairs.length; i++) {
    const [start, rate] = pairs[i];
    if (income <= start) break;
    const end = i + 1 < pairs.length ? pairs[i + 1][0] : Infinity;
    tax += (Math.min(income, end) - start) * rate;
  }
  return tax;
}

function resolveStdDeduction(stdDeduction, filingStatus) {
  if (!stdDeduction) return 0;
  if (stdDeduction === 'federal') return FEDERAL_STANDARD_DEDUCTION_2026[filingStatus];
  return filingStatus === 'marriedFilingJointly' ? stdDeduction.marriedFilingJointly : stdDeduction.single;
}

// Falls back to the Single bracket set for Head of Household / Married Filing
// Separately when a state doesn't publish its own schedule for them — see the note
// atop data/taxTables2026.js.
function resolveBrackets(info, filingStatus) {
  if (info.all) return info.all;
  if (filingStatus === 'marriedFilingJointly') return info.marriedFilingJointly || info.single;
  return info.single;
}

function calculateStateTax(taxableBeforeStateDeduction, filingStatus, info) {
  if (info.kind === 'none') return 0;
  const deduction = resolveStdDeduction(info.stdDeduction, filingStatus);
  const base = Math.max(0, taxableBeforeStateDeduction - deduction);
  if (info.kind === 'flat') return base * info.rate;
  let tax = marginalTax(base, resolveBrackets(info, filingStatus));
  if (info.surtax) tax += Math.max(0, base - info.surtax.threshold) * info.surtax.rate;
  return tax;
}

// Pre-tax deductions (401k, health insurance, etc.) reduce federal/state taxable
// income but NOT Social Security/Medicare wages — that's how a traditional 401k
// actually works, and there's no way to tell from a single dollar figure whether a
// deduction is the (FICA-exempt) 401k kind or the (FICA-reducing) cafeteria-plan
// insurance kind, so gross wages are used for FICA as the more common case.
export function calculateIncomeBreakdown({ annualIncome, filingStatus, stateCode, preTaxDeductions = 0 }) {
  const gross = Number(annualIncome) || 0;
  const preTax = Number(preTaxDeductions) || 0;
  const afterPreTax = Math.max(0, gross - preTax);

  const federalStdDeduction = FEDERAL_STANDARD_DEDUCTION_2026[filingStatus];
  const taxableIncomeFederal = Math.max(0, afterPreTax - federalStdDeduction);
  const federalTax = marginalTax(taxableIncomeFederal, FEDERAL_BRACKETS_2026[filingStatus]);

  const ficaWages = gross;
  const socialSecurityTax = Math.min(ficaWages, FICA_2026.socialSecurity.wageBase) * FICA_2026.socialSecurity.rate;
  const medicareTax = ficaWages * FICA_2026.medicare.rate;
  const additionalMedicareThreshold = FICA_2026.additionalMedicare.thresholds[filingStatus];
  const additionalMedicareTax = Math.max(0, ficaWages - additionalMedicareThreshold) * FICA_2026.additionalMedicare.rate;
  const ficaTax = socialSecurityTax + medicareTax + additionalMedicareTax;

  const info = stateTaxInfo(stateCode);
  const stateTax = calculateStateTax(afterPreTax, filingStatus, info);

  const totalTax = federalTax + ficaTax + stateTax;
  const annualTakeHome = afterPreTax - totalTax;
  const monthlyTakeHome = annualTakeHome / 12;

  return {
    grossAnnual: gross,
    preTaxDeductions: preTax,
    afterPreTax,
    federalStdDeduction,
    taxableIncomeFederal,
    federalTax,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    ficaTax,
    stateTax,
    stateHasTax: info.kind !== 'none',
    totalTax,
    annualTakeHome,
    monthlyTakeHome,
  };
}
