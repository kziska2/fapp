// Tax year 2026 estimates for the Budget tab's income calculator (docs/BUDGET.md).
// Sourced from the IRS's own Rev. Proc. 2025-32 (federal brackets/standard deduction),
// the SSA's Oct. 2025 wage-base announcement (FICA), and Tax Foundation's 2026 state
// table cross-checked against state-government sources (state brackets). This is a
// planning estimate, not exact paycheck math — no credits, no itemization.
//
// Bracket arrays are [thresholdStart, rate] pairs, ascending, applied marginally by
// utils/tax.js — each rate applies to income between its threshold and the next one.
//
// Many states only publish Single/Married-Filing-Jointly brackets. Where a state has no
// explicit Head-of-Household or Married-Filing-Separately schedule, utils/tax.js falls
// back to the Single brackets for both — a known simplification, not a data gap.

export const FEDERAL_STANDARD_DEDUCTION_2026 = {
  single: 16100,
  marriedFilingJointly: 32200,
  marriedFilingSeparately: 16100,
  headOfHousehold: 24150,
};

export const FEDERAL_BRACKETS_2026 = {
  single: [[0, 0.10], [12400, 0.12], [50400, 0.22], [105700, 0.24], [201775, 0.32], [256225, 0.35], [640600, 0.37]],
  marriedFilingJointly: [[0, 0.10], [24800, 0.12], [100800, 0.22], [211400, 0.24], [403550, 0.32], [512450, 0.35], [768700, 0.37]],
  marriedFilingSeparately: [[0, 0.10], [12400, 0.12], [50400, 0.22], [105700, 0.24], [201775, 0.32], [256225, 0.35], [384350, 0.37]],
  headOfHousehold: [[0, 0.10], [17700, 0.12], [67450, 0.22], [105700, 0.24], [201750, 0.32], [256200, 0.35], [640600, 0.37]],
};

export const FICA_2026 = {
  socialSecurity: { rate: 0.062, wageBase: 184500 },
  medicare: { rate: 0.0145 },
  additionalMedicare: {
    rate: 0.009,
    // Fixed by statute since 2013 — not inflation-indexed.
    thresholds: { single: 200000, headOfHousehold: 200000, marriedFilingJointly: 250000, marriedFilingSeparately: 125000 },
  },
};

const NO_STATE_TAX = ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'];

// 'federal' means "this state's standard deduction conforms to the federal one."
const STATE_FLAT_2026 = {
  AZ: { rate: 0.025, stdDeduction: { single: 14600, marriedFilingJointly: 29200 } },
  CO: { rate: 0.044, stdDeduction: 'federal' },
  GA: { rate: 0.0519, stdDeduction: { single: 12000, marriedFilingJointly: 24000 } },
  ID: { rate: 0.053, stdDeduction: 'federal' },
  IL: { rate: 0.0495, stdDeduction: null },
  IN: { rate: 0.0295, stdDeduction: null },
  IA: { rate: 0.038, stdDeduction: { single: 16100, marriedFilingJointly: 32200 } },
  KY: { rate: 0.035, stdDeduction: { single: 3360, marriedFilingJointly: 3360 } },
  LA: { rate: 0.03, stdDeduction: { single: 12875, marriedFilingJointly: 25750 } },
  MI: { rate: 0.0425, stdDeduction: null },
  MS: { rate: 0.04, stdDeduction: { single: 2300, marriedFilingJointly: 4600 } },
  NC: { rate: 0.0399, stdDeduction: { single: 12750, marriedFilingJointly: 25500 } },
  PA: { rate: 0.0307, stdDeduction: null },
  UT: { rate: 0.0445, stdDeduction: null },
};

const STATE_GRADUATED_2026 = {
  AL: {
    single: [[0, 0.02], [500, 0.04], [3000, 0.05]],
    marriedFilingJointly: [[0, 0.02], [1000, 0.04], [6000, 0.05]],
    stdDeduction: { single: 3000, marriedFilingJointly: 8500 },
  },
  AR: { all: [[0, 0.02], [4600, 0.039]], stdDeduction: { single: 2470, marriedFilingJointly: 4940 } },
  CA: {
    single: [[0, 0.01], [11079, 0.02], [26264, 0.04], [41452, 0.06], [57542, 0.08], [72724, 0.093], [371479, 0.103], [445771, 0.113], [742953, 0.123]],
    marriedFilingJointly: [[0, 0.01], [22158, 0.02], [52528, 0.04], [82904, 0.06], [115084, 0.08], [145448, 0.093], [742958, 0.103], [891542, 0.113], [1485906, 0.123]],
    stdDeduction: { single: 5540, marriedFilingJointly: 11080 },
    // Not doubled for joint filers — a real marriage-penalty quirk, confirmed, not a bug.
    surtax: { threshold: 1000000, rate: 0.01 },
  },
  CT: {
    single: [[0, 0.02], [10000, 0.045], [50000, 0.055], [100000, 0.06], [200000, 0.065], [250000, 0.069], [500000, 0.0699]],
    marriedFilingJointly: [[0, 0.02], [20000, 0.045], [100000, 0.055], [200000, 0.06], [400000, 0.065], [500000, 0.069], [1000000, 0.0699]],
  },
  DE: { all: [[0, 0], [2000, 0.022], [5000, 0.039], [10000, 0.048], [20000, 0.052], [25000, 0.0555], [60000, 0.066]], stdDeduction: { single: 3250, marriedFilingJointly: 6500 } },
  HI: {
    single: [[0, 0.014], [9600, 0.032], [14400, 0.055], [19200, 0.064], [24000, 0.068], [36000, 0.072], [48000, 0.076], [125000, 0.079], [175000, 0.0825], [225000, 0.09], [275000, 0.10], [325000, 0.11]],
    marriedFilingJointly: [[0, 0.014], [19200, 0.032], [28800, 0.055], [38400, 0.064], [48000, 0.068], [72000, 0.072], [96000, 0.076], [250000, 0.079], [350000, 0.0825], [450000, 0.09], [550000, 0.10], [650000, 0.11]],
    stdDeduction: { single: 4400, marriedFilingJointly: 8800 },
  },
  KS: { single: [[0, 0.052], [23000, 0.0558]], marriedFilingJointly: [[0, 0.052], [46000, 0.0558]], stdDeduction: { single: 3605, marriedFilingJointly: 8240 } },
  ME: { single: [[0, 0.058], [27399, 0.0675], [64849, 0.0715]], marriedFilingJointly: [[0, 0.058], [54849, 0.0675], [129749, 0.0715]], stdDeduction: { single: 8350, marriedFilingJointly: 16700 } },
  MD: {
    single: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [100000, 0.05], [125000, 0.0525], [150000, 0.055], [250000, 0.0575], [500000, 0.0625], [1000000, 0.065]],
    marriedFilingJointly: [[0, 0.02], [1000, 0.03], [2000, 0.04], [3000, 0.0475], [150000, 0.05], [175000, 0.0525], [225000, 0.055], [300000, 0.0575], [600000, 0.0625], [1200000, 0.065]],
    stdDeduction: { single: 3350, marriedFilingJointly: 6700 },
    // Excludes Maryland's mandatory county/Baltimore-city local income tax (~2.25–3.2%
    // on top of this) — not modeled since it varies by county, not just state.
  },
  MA: { all: [[0, 0.05]], stdDeduction: null, surtax: { threshold: 1107850, rate: 0.04 } },
  MN: {
    single: [[0, 0.0535], [33310, 0.068], [109430, 0.0785], [203150, 0.0985]],
    marriedFilingJointly: [[0, 0.0535], [48700, 0.068], [193480, 0.0785], [337930, 0.0985]],
    stdDeduction: { single: 15300, marriedFilingJointly: 30600 },
  },
  MO: { all: [[0, 0], [1348, 0.02], [2696, 0.025], [4044, 0.03], [5392, 0.035], [6740, 0.04], [8088, 0.045], [9436, 0.047]], stdDeduction: { single: 16100, marriedFilingJointly: 32200 } },
  MT: { single: [[0, 0.047], [47500, 0.0565]], marriedFilingJointly: [[0, 0.047], [95000, 0.0565]], stdDeduction: { single: 16100, marriedFilingJointly: 32200 } },
  NE: { single: [[0, 0.0246], [4130, 0.0351], [24760, 0.0455]], marriedFilingJointly: [[0, 0.0246], [8250, 0.0351], [49530, 0.0455]], stdDeduction: { single: 8850, marriedFilingJointly: 17700 } },
  NJ: {
    single: [[0, 0.014], [20000, 0.0175], [35000, 0.035], [40000, 0.0553], [75000, 0.0637], [500000, 0.0897], [1000000, 0.1075]],
    marriedFilingJointly: [[0, 0.014], [20000, 0.0175], [50000, 0.0245], [70000, 0.035], [80000, 0.0553], [150000, 0.0637], [500000, 0.0897], [1000000, 0.1075]],
  },
  NM: {
    single: [[0, 0.015], [5500, 0.032], [16500, 0.043], [33500, 0.047], [66500, 0.049], [210000, 0.059]],
    marriedFilingJointly: [[0, 0.015], [8000, 0.032], [25000, 0.043], [50000, 0.047], [100000, 0.049], [315000, 0.059]],
    stdDeduction: { single: 16100, marriedFilingJointly: 32200 },
  },
  NY: {
    single: [[0, 0.039], [8500, 0.044], [11700, 0.0515], [13900, 0.054], [80650, 0.059], [215400, 0.0685], [1077550, 0.0965], [5000000, 0.103], [25000000, 0.109]],
    marriedFilingJointly: [[0, 0.039], [17150, 0.044], [23600, 0.0515], [27900, 0.054], [161550, 0.059], [323200, 0.0685], [2155350, 0.0965], [5000000, 0.103], [25000000, 0.109]],
    stdDeduction: { single: 8000, marriedFilingJointly: 16050 },
    // Excludes NYC's separate local income tax.
  },
  ND: { single: [[0, 0], [48475, 0.0195], [244825, 0.025]], marriedFilingJointly: [[0, 0], [80975, 0.0195], [298075, 0.025]], stdDeduction: { single: 16100, marriedFilingJointly: 32200 } },
  OH: { all: [[0, 0], [26050, 0.0275]], stdDeduction: null },
  OK: { single: [[0, 0], [3750, 0.025], [4900, 0.035], [7200, 0.045]], marriedFilingJointly: [[0, 0], [7500, 0.025], [9800, 0.035], [14400, 0.045]], stdDeduction: { single: 6350, marriedFilingJointly: 12700 } },
  OR: { single: [[0, 0.0475], [4550, 0.0675], [11400, 0.0875], [125000, 0.099]], marriedFilingJointly: [[0, 0.0475], [9100, 0.0675], [22800, 0.0875], [250000, 0.099]], stdDeduction: { single: 2910, marriedFilingJointly: 5820 } },
  RI: { all: [[0, 0.0375], [82050, 0.0475], [186450, 0.0599]], stdDeduction: { single: 11200, marriedFilingJointly: 22400 } },
  SC: { all: [[0, 0], [3640, 0.03], [18230, 0.06]], stdDeduction: { single: 8350, marriedFilingJointly: 16700 } },
  VT: {
    single: [[0, 0.0335], [49400, 0.066], [119700, 0.076], [249700, 0.0875]],
    marriedFilingJointly: [[0, 0.0335], [82500, 0.066], [199450, 0.076], [304000, 0.0875]],
    stdDeduction: { single: 7650, marriedFilingJointly: 15300 },
  },
  VA: { all: [[0, 0.02], [3000, 0.03], [5000, 0.05], [17000, 0.0575]], stdDeduction: { single: 8750, marriedFilingJointly: 17500 } },
  WV: { all: [[0, 0.0222], [10000, 0.0296], [25000, 0.0333], [40000, 0.0444], [60000, 0.0482]] },
  WI: {
    single: [[0, 0.035], [15110, 0.044], [51950, 0.053], [332720, 0.0765]],
    marriedFilingJointly: [[0, 0.035], [20150, 0.044], [69260, 0.053], [443630, 0.0765]],
    stdDeduction: { single: 13960, marriedFilingJointly: 25840 },
  },
  DC: { all: [[0, 0.04], [10000, 0.06], [40000, 0.065], [60000, 0.085], [250000, 0.0925], [500000, 0.0975], [1000000, 0.1075]], stdDeduction: { single: 16100, marriedFilingJointly: 32200 } },
};

export const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export function stateTaxInfo(stateCode) {
  if (NO_STATE_TAX.includes(stateCode)) return { kind: 'none' };
  if (STATE_FLAT_2026[stateCode]) return { kind: 'flat', ...STATE_FLAT_2026[stateCode] };
  if (STATE_GRADUATED_2026[stateCode]) return { kind: 'graduated', ...STATE_GRADUATED_2026[stateCode] };
  return { kind: 'none' };
}
