export interface SIPResult {
  totalInvested: number;
  estimatedReturns: number;
  grossMaturityValue: number;
  ltcgTax: number;
  netMaturityValue: number;
  wealthGainMultiple: number;    // e.g. 3.2x
  inflationAdjustedValue: number; // real value in today's money
  monthlyData: {                  // for chart
    month: number;
    invested: number;
    value: number;
  }[];
}

export const calculateSIP = (
  monthlyAmount: number,
  years: number,
  expectedReturnPct: number,
  taxSlab: number,
  inflationPct: number = 6
): SIPResult => {
  const months = years * 12;
  const monthlyRate = expectedReturnPct / 100 / 12;
  const totalInvested = monthlyAmount * months;

  // Future Value of SIP
  // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
  const fv = monthlyAmount * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * 
    (1 + monthlyRate);

  const gains = fv - totalInvested;

  // LTCG tax (equity funds held > 1 year)
  // Gains above ₹1.25 lakh taxed at 12.5%
  const exemptGains = 125000;
  const taxableGains = Math.max(0, gains - exemptGains);
  const ltcgTax = taxableGains * 0.125;

  const netValue = fv - ltcgTax;

  // Inflation-adjusted value (what ₹X in future = in today's money)
  const inflationFactor = Math.pow(1 + inflationPct/100, years);
  const inflationAdjustedValue = netValue / inflationFactor;

  // Monthly progression data for chart
  const monthlyData = [];
  let currentValue = 0;
  let totalContributed = 0;
  
  for (let m = 1; m <= months; m++) {
    currentValue = (currentValue + monthlyAmount) * (1 + monthlyRate);
    totalContributed += monthlyAmount;
    
    if (m % 12 === 0) { // yearly data points
      monthlyData.push({
        month: m,
        invested: Math.round(totalContributed),
        value: Math.round(currentValue),
      });
    }
  }

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(gains),
    grossMaturityValue: Math.round(fv),
    ltcgTax: Math.round(ltcgTax),
    netMaturityValue: Math.round(netValue),
    wealthGainMultiple: parseFloat((fv / (totalInvested || 1)).toFixed(2)),
    inflationAdjustedValue: Math.round(inflationAdjustedValue),
    monthlyData,
  };
};
