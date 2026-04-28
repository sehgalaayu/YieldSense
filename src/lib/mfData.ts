// src/lib/mfData.ts

export interface MutualFund {
  id: string;
  schemeName: string;           // Full name
  shortName: string;            // Display name e.g. "Mirae Asset Large Cap"
  amcName: string;              // e.g. "Mirae Asset"
  category: string;             // e.g. "Large Cap", "Flexi Cap", "ELSS", "Index"
  subCategory: string;          // e.g. "Equity", "Debt", "Hybrid"
  variant: 'Regular' | 'Direct';
  expenseRatio: number;         // Annual %, e.g. 1.52
  nav: number;                  // Current NAV
  aum: number;                  // AUM in crores
  returns: {
    oneYear: number;            // % returns
    threeYear: number;
    fiveYear: number;
  };
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  exitLoad: string;             // e.g. "1% if redeemed within 1 year"
  directPairId: string | null;  // ID of the Direct variant of this fund
  regularPairId: string | null; // ID of the Regular variant of this fund
  schemeCode: string;           // AMFI scheme code for API calls
  isIndexFund: boolean;
  benchmarkIndex: string;       // e.g. "Nifty 50", "Sensex"
}

// CURATED DATASET — 15 fund pairs (30 funds total)
// Each pair = 1 Regular + 1 Direct variant of same fund
export const mfDataset: MutualFund[] = [
  // PAIR 1 — Mirae Asset Large Cap
  {
    id: 'mirae-lc-reg',
    schemeName: 'Mirae Asset Large Cap Fund - Regular Plan - Growth',
    shortName: 'Mirae Asset Large Cap',
    amcName: 'Mirae Asset',
    category: 'Large Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.52,
    nav: 102.45,
    aum: 38420,
    returns: { oneYear: 18.4, threeYear: 14.2, fiveYear: 16.8 },
    riskLevel: 'High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: 'mirae-lc-dir',
    regularPairId: null,
    schemeCode: '118989',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 100'
  },
  {
    id: 'mirae-lc-dir',
    schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth',
    shortName: 'Mirae Asset Large Cap',
    amcName: 'Mirae Asset',
    category: 'Large Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.54,
    nav: 108.32,
    aum: 38420,
    returns: { oneYear: 19.6, threeYear: 15.4, fiveYear: 18.1 },
    riskLevel: 'High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: null,
    regularPairId: 'mirae-lc-reg',
    schemeCode: '118988',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 100'
  },

  // PAIR 2 — HDFC Flexi Cap
  {
    id: 'hdfc-fc-reg',
    schemeName: 'HDFC Flexi Cap Fund - Regular Plan - Growth',
    shortName: 'HDFC Flexi Cap',
    amcName: 'HDFC Mutual Fund',
    category: 'Flexi Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.68,
    nav: 1842.30,
    aum: 62840,
    returns: { oneYear: 22.1, threeYear: 18.6, fiveYear: 20.4 },
    riskLevel: 'Very High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: 'hdfc-fc-dir',
    regularPairId: null,
    schemeCode: '100016',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 500'
  },
  {
    id: 'hdfc-fc-dir',
    schemeName: 'HDFC Flexi Cap Fund - Direct Plan - Growth',
    shortName: 'HDFC Flexi Cap',
    amcName: 'HDFC Mutual Fund',
    category: 'Flexi Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.78,
    nav: 1961.45,
    aum: 62840,
    returns: { oneYear: 23.2, threeYear: 19.8, fiveYear: 21.6 },
    riskLevel: 'Very High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: null,
    regularPairId: 'hdfc-fc-reg',
    schemeCode: '100017',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 500'
  },

  // PAIR 3 — Axis Bluechip
  {
    id: 'axis-bc-reg',
    schemeName: 'Axis Bluechip Fund - Regular Plan - Growth',
    shortName: 'Axis Bluechip',
    amcName: 'Axis Mutual Fund',
    category: 'Large Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.45,
    nav: 58.72,
    aum: 28650,
    returns: { oneYear: 15.8, threeYear: 12.4, fiveYear: 14.9 },
    riskLevel: 'High',
    exitLoad: '1% if redeemed within 12 months',
    directPairId: 'axis-bc-dir',
    regularPairId: null,
    schemeCode: '112059',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 50'
  },
  {
    id: 'axis-bc-dir',
    schemeName: 'Axis Bluechip Fund - Direct Plan - Growth',
    shortName: 'Axis Bluechip',
    amcName: 'Axis Mutual Fund',
    category: 'Large Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.42,
    nav: 62.18,
    aum: 28650,
    returns: { oneYear: 16.9, threeYear: 13.6, fiveYear: 16.1 },
    riskLevel: 'High',
    exitLoad: '1% if redeemed within 12 months',
    directPairId: null,
    regularPairId: 'axis-bc-reg',
    schemeCode: '112058',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 50'
  },

  // PAIR 4 — SBI Nifty 50 Index Fund
  {
    id: 'sbi-nifty-reg',
    schemeName: 'SBI Nifty 50 Index Fund - Regular Plan - Growth',
    shortName: 'SBI Nifty 50 Index',
    amcName: 'SBI Mutual Fund',
    category: 'Index Fund',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 0.50,
    nav: 182.40,
    aum: 8420,
    returns: { oneYear: 19.2, threeYear: 14.8, fiveYear: 17.2 },
    riskLevel: 'High',
    exitLoad: 'Nil',
    directPairId: 'sbi-nifty-dir',
    regularPairId: null,
    schemeCode: '130503',
    isIndexFund: true,
    benchmarkIndex: 'Nifty 50'
  },
  {
    id: 'sbi-nifty-dir',
    schemeName: 'SBI Nifty 50 Index Fund - Direct Plan - Growth',
    shortName: 'SBI Nifty 50 Index',
    amcName: 'SBI Mutual Fund',
    category: 'Index Fund',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.20,
    nav: 186.80,
    aum: 8420,
    returns: { oneYear: 19.5, threeYear: 15.1, fiveYear: 17.5 },
    riskLevel: 'High',
    exitLoad: 'Nil',
    directPairId: null,
    regularPairId: 'sbi-nifty-reg',
    schemeCode: '130502',
    isIndexFund: true,
    benchmarkIndex: 'Nifty 50'
  },

  // PAIR 5 — Parag Parikh Flexi Cap
  {
    id: 'ppfas-fc-reg',
    schemeName: 'Parag Parikh Flexi Cap Fund - Regular Plan - Growth',
    shortName: 'Parag Parikh Flexi Cap',
    amcName: 'PPFAS Mutual Fund',
    category: 'Flexi Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.35,
    nav: 72.40,
    aum: 72840,
    returns: { oneYear: 21.4, threeYear: 17.8, fiveYear: 22.1 },
    riskLevel: 'Very High',
    exitLoad: '2% if redeemed within 365 days',
    directPairId: 'ppfas-fc-dir',
    regularPairId: null,
    schemeCode: '122639',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 500'
  },
  {
    id: 'ppfas-fc-dir',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth',
    shortName: 'Parag Parikh Flexi Cap',
    amcName: 'PPFAS Mutual Fund',
    category: 'Flexi Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.58,
    nav: 76.20,
    aum: 72840,
    returns: { oneYear: 22.5, threeYear: 18.9, fiveYear: 23.2 },
    riskLevel: 'Very High',
    exitLoad: '2% if redeemed within 365 days',
    directPairId: null,
    regularPairId: 'ppfas-fc-reg',
    schemeCode: '122640',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 500'
  },

  // PAIR 6 — ICICI Pru Bluechip
  {
    id: 'icici-bc-reg',
    schemeName: 'ICICI Prudential Bluechip Fund - Regular Plan - Growth',
    shortName: 'ICICI Pru Bluechip',
    amcName: 'ICICI Prudential',
    category: 'Large Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.62,
    nav: 98.45,
    aum: 52840,
    returns: { oneYear: 20.1, threeYear: 16.4, fiveYear: 18.9 },
    riskLevel: 'High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: 'icici-bc-dir',
    regularPairId: null,
    schemeCode: '120586',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 100'
  },
  {
    id: 'icici-bc-dir',
    schemeName: 'ICICI Prudential Bluechip Fund - Direct Plan - Growth',
    shortName: 'ICICI Pru Bluechip',
    amcName: 'ICICI Prudential',
    category: 'Large Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.87,
    nav: 104.20,
    aum: 52840,
    returns: { oneYear: 21.2, threeYear: 17.5, fiveYear: 20.0 },
    riskLevel: 'High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: null,
    regularPairId: 'icici-bc-reg',
    schemeCode: '120585',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 100'
  },

  // PAIR 7 — Kotak Emerging Equity
  {
    id: 'kotak-ee-reg',
    schemeName: 'Kotak Emerging Equity Fund - Regular Plan - Growth',
    shortName: 'Kotak Emerging Equity',
    amcName: 'Kotak Mutual Fund',
    category: 'Mid Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.71,
    nav: 142.80,
    aum: 42180,
    returns: { oneYear: 28.4, threeYear: 22.6, fiveYear: 26.8 },
    riskLevel: 'Very High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: 'kotak-ee-dir',
    regularPairId: null,
    schemeCode: '120252',
    isIndexFund: false,
    benchmarkIndex: 'Nifty Midcap 150'
  },
  {
    id: 'kotak-ee-dir',
    schemeName: 'Kotak Emerging Equity Fund - Direct Plan - Growth',
    shortName: 'Kotak Emerging Equity',
    amcName: 'Kotak Mutual Fund',
    category: 'Mid Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.42,
    nav: 152.40,
    aum: 42180,
    returns: { oneYear: 30.0, threeYear: 24.2, fiveYear: 28.4 },
    riskLevel: 'Very High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: null,
    regularPairId: 'kotak-ee-reg',
    schemeCode: '120253',
    isIndexFund: false,
    benchmarkIndex: 'Nifty Midcap 150'
  },

  // PAIR 8 — Nippon India Small Cap
  {
    id: 'nippon-sc-reg',
    schemeName: 'Nippon India Small Cap Fund - Regular Plan - Growth',
    shortName: 'Nippon India Small Cap',
    amcName: 'Nippon India',
    category: 'Small Cap',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.58,
    nav: 148.20,
    aum: 52480,
    returns: { oneYear: 32.6, threeYear: 28.4, fiveYear: 34.2 },
    riskLevel: 'Very High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: 'nippon-sc-dir',
    regularPairId: null,
    schemeCode: '118778',
    isIndexFund: false,
    benchmarkIndex: 'Nifty Smallcap 250'
  },
  {
    id: 'nippon-sc-dir',
    schemeName: 'Nippon India Small Cap Fund - Direct Plan - Growth',
    shortName: 'Nippon India Small Cap',
    amcName: 'Nippon India',
    category: 'Small Cap',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.68,
    nav: 158.40,
    aum: 52480,
    returns: { oneYear: 33.8, threeYear: 29.6, fiveYear: 35.4 },
    riskLevel: 'Very High',
    exitLoad: '1% if redeemed within 1 year',
    directPairId: null,
    regularPairId: 'nippon-sc-reg',
    schemeCode: '118779',
    isIndexFund: false,
    benchmarkIndex: 'Nifty Smallcap 250'
  },

  // PAIR 9 — DSP Tax Saver (ELSS)
  {
    id: 'dsp-elss-reg',
    schemeName: 'DSP Tax Saver Fund - Regular Plan - Growth',
    shortName: 'DSP Tax Saver (ELSS)',
    amcName: 'DSP Mutual Fund',
    category: 'ELSS',
    subCategory: 'Equity',
    variant: 'Regular',
    expenseRatio: 1.82,
    nav: 112.40,
    aum: 14820,
    returns: { oneYear: 24.2, threeYear: 18.8, fiveYear: 22.4 },
    riskLevel: 'Very High',
    exitLoad: 'Nil (3-year lock-in)',
    directPairId: 'dsp-elss-dir',
    regularPairId: null,
    schemeCode: '108023',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 500'
  },
  {
    id: 'dsp-elss-dir',
    schemeName: 'DSP Tax Saver Fund - Direct Plan - Growth',
    shortName: 'DSP Tax Saver (ELSS)',
    amcName: 'DSP Mutual Fund',
    category: 'ELSS',
    subCategory: 'Equity',
    variant: 'Direct',
    expenseRatio: 0.74,
    nav: 120.80,
    aum: 14820,
    returns: { oneYear: 25.4, threeYear: 20.0, fiveYear: 23.6 },
    riskLevel: 'Very High',
    exitLoad: 'Nil (3-year lock-in)',
    directPairId: null,
    regularPairId: 'dsp-elss-reg',
    schemeCode: '108024',
    isIndexFund: false,
    benchmarkIndex: 'Nifty 500'
  },

  // PAIR 10 — HDFC Short Duration Debt
  {
    id: 'hdfc-sd-reg',
    schemeName: 'HDFC Short Duration Debt Fund - Regular Plan - Growth',
    shortName: 'HDFC Short Duration',
    amcName: 'HDFC Mutual Fund',
    category: 'Short Duration',
    subCategory: 'Debt',
    variant: 'Regular',
    expenseRatio: 0.82,
    nav: 28.40,
    aum: 22840,
    returns: { oneYear: 7.2, threeYear: 6.4, fiveYear: 7.0 },
    riskLevel: 'Low',
    exitLoad: 'Nil',
    directPairId: 'hdfc-sd-dir',
    regularPairId: null,
    schemeCode: '100033',
    isIndexFund: false,
    benchmarkIndex: 'CRISIL Short Duration'
  },
  {
    id: 'hdfc-sd-dir',
    schemeName: 'HDFC Short Duration Debt Fund - Direct Plan - Growth',
    shortName: 'HDFC Short Duration',
    amcName: 'HDFC Mutual Fund',
    category: 'Short Duration',
    subCategory: 'Debt',
    variant: 'Direct',
    expenseRatio: 0.30,
    nav: 29.80,
    aum: 22840,
    returns: { oneYear: 7.7, threeYear: 6.9, fiveYear: 7.5 },
    riskLevel: 'Low',
    exitLoad: 'Nil',
    directPairId: null,
    regularPairId: 'hdfc-sd-reg',
    schemeCode: '100034',
    isIndexFund: false,
    benchmarkIndex: 'CRISIL Short Duration'
  },
];

// Get only Regular funds (for search/input)
export const regularFunds = mfDataset.filter(f => f.variant === 'Regular');

// Get Direct equivalent of a Regular fund
export const getDirectEquivalent = (regularFundId: string): MutualFund | null => {
  const regular = mfDataset.find(f => f.id === regularFundId);
  if (!regular?.directPairId) return null;
  return mfDataset.find(f => f.id === regular.directPairId) || null;
};

// Search funds by name (fuzzy)
export const searchFunds = (query: string): MutualFund[] => {
  const q = query.toLowerCase();
  return regularFunds.filter(f => 
    f.shortName.toLowerCase().includes(q) || 
    f.amcName.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q)
  );
};
