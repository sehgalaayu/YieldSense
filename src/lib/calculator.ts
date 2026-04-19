import { CalculationInput, CalculationResult } from './types';

export function calculateYield(input: CalculationInput): CalculationResult {
  const { principal, grossRate, tenorMonths, taxSlab, interestType } = input;
  
  const annualRate = grossRate / 100;
  const tYears = tenorMonths / 12;
  
  let grossMaturityAmount: number;
  let grossInterestEarned: number;

  if (interestType === 'Cumulative') {
    // Quarterly compounding is standard for Indian FDs
    grossMaturityAmount = principal * Math.pow(1 + annualRate / 4, 4 * tYears);
    grossInterestEarned = grossMaturityAmount - principal;
  } else {
    // Monthly Payout (Simple Interest for calculation purposes generally, or monthly compounding if reinvested)
    // Most banks pay monthly payout as principal * (rate / 12)
    const monthlyPayout = (principal * annualRate) / 12;
    grossInterestEarned = monthlyPayout * tenorMonths;
    grossMaturityAmount = principal + grossInterestEarned;
  }

  // TDS Rules
  // TDS at 10% if interest > 40,000 per year
  const annualInterest = grossInterestEarned / tYears;
  const tdsThreshold = 40000;
  let tdsDeducted = 0;
  
  if (annualInterest > tdsThreshold) {
    tdsDeducted = grossInterestEarned * 0.10;
  }

  // Total Tax payable based on slab
  // Interest is added to income. Slab is total tax percentage.
  const totalTaxPayable = grossInterestEarned * (taxSlab / 100);
  
  // Tax Payable after TDS credit
  const additionalTax = Math.max(0, totalTaxPayable - tdsDeducted);
  
  const netInterestEarned = grossInterestEarned - totalTaxPayable;
  const netMaturityAmount = principal + netInterestEarned;
  
  // Post-tax CAGR (Yield)
  const effectiveAnnualYield = (Math.pow(netMaturityAmount / principal, 1 / tYears) - 1) * 100;

  return {
    grossMaturityAmount,
    grossInterestEarned,
    tdsDeducted,
    taxPayable: additionalTax,
    netInterestEarned,
    netMaturityAmount,
    effectiveAnnualYield,
    monthlyPayout: interestType === 'MonthlyPayout' ? (principal * annualRate) / 12 : undefined
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
