// src/lib/mfCalculator.ts

export interface SwitchAnalysis {
  regularFund: {
    name: string;
    expenseRatio: number;
    annualCostRs: number;
    projectedValue10Y: number;
  };
  directFund: {
    name: string;
    expenseRatio: number;
    annualCostRs: number;
    projectedValue10Y: number;
  };
  expenseRatioDiff: number;        // e.g. 1.10 (percentage points)
  annualSavingRs: number;          // Annual saving in ₹
  savingOver5Y: number;            // Total saving over 5 years in ₹
  savingOver10Y: number;           // Total saving over 10 years in ₹
  savingOver20Y: number;           // Total saving over 20 years in ₹
  returnDiff1Y: number;            // Difference in 1Y returns %
  returnDiff3Y: number;
  shouldSwitch: boolean;           // Recommendation
  switchUrgency: 'High' | 'Medium' | 'Low';
  exitLoadWarning: string | null;  // Warning if exit load applies
  taxNote: string;                 // Capital gains tax note
  switchSteps: string[];           // Step by step how to switch
}

export interface HoldingInput {
  fundId: string;
  investedAmount: number;          // Current value in ₹
  holdingPeriodMonths: number;     // How long they've held it
}

// Core calculation: lifetime cost savings
export const calculateSwitchSavings = (
  investedAmount: number,
  regularExpenseRatio: number,
  directExpenseRatio: number,
  assumedGrossReturn: number = 12  // 12% assumed pre-expense return
): {
  annualSaving: number;
  saving5Y: number;
  saving10Y: number;
  saving20Y: number;
  regularValue10Y: number;
  directValue10Y: number;
} => {
  const regularNetReturn = assumedGrossReturn - regularExpenseRatio;
  const directNetReturn = assumedGrossReturn - directExpenseRatio;
  
  const annualSaving = investedAmount * (directExpenseRatio - regularExpenseRatio) / 100;
  // Note: this is simplified — actual saving compounds over time
  
  // Compound growth
  const regularValue5Y = investedAmount * Math.pow(1 + regularNetReturn / 100, 5);
  const directValue5Y = investedAmount * Math.pow(1 + directNetReturn / 100, 5);
  
  const regularValue10Y = investedAmount * Math.pow(1 + regularNetReturn / 100, 10);
  const directValue10Y = investedAmount * Math.pow(1 + directNetReturn / 100, 10);
  
  const regularValue20Y = investedAmount * Math.pow(1 + regularNetReturn / 100, 20);
  const directValue20Y = investedAmount * Math.pow(1 + directNetReturn / 100, 20);
  
  return {
    annualSaving: Math.round(directValue5Y / 5 - regularValue5Y / 5), // rough annual
    saving5Y: Math.round(directValue5Y - regularValue5Y),
    saving10Y: Math.round(directValue10Y - regularValue10Y),
    saving20Y: Math.round(directValue20Y - regularValue20Y),
    regularValue10Y: Math.round(regularValue10Y),
    directValue10Y: Math.round(directValue10Y),
  };
};

// Tax implications of switching
export const getSwitchTaxNote = (
  holdingPeriodMonths: number,
  gain: number,
  fundSubCategory: 'Equity' | 'Debt' | 'Hybrid'
): string => {
  if (fundSubCategory === 'Equity') {
    if (holdingPeriodMonths < 12) {
      return `Short-term capital gains tax (STCG) at 20% applies on ₹${gain.toLocaleString('en-IN')} profit. Consider waiting until 12 months to pay only 12.5% LTCG.`;
    } else {
      const taxableGain = Math.max(0, gain - 125000); // ₹1.25L exemption
      if (taxableGain <= 0) return 'No capital gains tax — your gains are within the ₹1.25 lakh annual exemption.';
      return `Long-term capital gains tax (LTCG) at 12.5% applies on ₹${taxableGain.toLocaleString('en-IN')} (gains above ₹1.25L).`;
    }
  } else if (fundSubCategory === 'Debt') {
     return `For debt funds bought after Apr 2023, gains are taxed at your income slab rate regardless of holding period.`;
  } else {
     return `Taxation depends on the equity/debt allocation of the hybrid fund. Check the specific fund details.`;
  }
};
// Full switch analysis for a single holding
export const analyzeSwitch = (
  holding: HoldingInput,
  regularFund: any,
  directFund: any
): SwitchAnalysis => {
  const gain = holding.investedAmount * 0.15; // estimated 15% gain assumption
  const savings = calculateSwitchSavings(
    holding.investedAmount,
    regularFund.expenseRatio,
    directFund.expenseRatio
  );

  const expenseRatioDiff = regularFund.expenseRatio - directFund.expenseRatio;
  const urgency = expenseRatioDiff > 1.0 ? 'High' : expenseRatioDiff > 0.5 ? 'Medium' : 'Low';

  // Exit load check
  let exitLoadWarning = null;
  if (regularFund.exitLoad !== 'Nil' && holding.holdingPeriodMonths < 12) {
    exitLoadWarning = `Exit load applies: ${regularFund.exitLoad}. Switching now will incur this charge.`;
  }

  return {
    regularFund: {
      name: regularFund.schemeName,
      expenseRatio: regularFund.expenseRatio,
      annualCostRs: Math.round(holding.investedAmount * regularFund.expenseRatio / 100),
      projectedValue10Y: savings.regularValue10Y,
    },
    directFund: {
      name: directFund.schemeName,
      expenseRatio: directFund.expenseRatio,
      annualCostRs: Math.round(holding.investedAmount * directFund.expenseRatio / 100),
      projectedValue10Y: savings.directValue10Y,
    },
    expenseRatioDiff: parseFloat(expenseRatioDiff.toFixed(2)),
    annualSavingRs: savings.annualSaving,
    savingOver5Y: savings.saving5Y,
    savingOver10Y: savings.saving10Y,
    savingOver20Y: savings.saving20Y,
    returnDiff1Y: parseFloat((directFund.returns.oneYear - regularFund.returns.oneYear).toFixed(2)),
    returnDiff3Y: parseFloat((directFund.returns.threeYear - regularFund.returns.threeYear).toFixed(2)),
    shouldSwitch: expenseRatioDiff > 0.3 && !exitLoadWarning,
    switchUrgency: urgency,
    exitLoadWarning,
    taxNote: getSwitchTaxNote(holding.holdingPeriodMonths, gain, regularFund.subCategory),
    switchSteps: [
      `Log in to your broker or AMC app (Zerodha Coin, Groww, MF Central)`,
      `Search for "${directFund.shortName} Direct Plan"`,
      `Place a switch request — same amount as your current Regular holding`,
      `Switch completes in 1-3 business days (T+1 for equity funds)`,
      `New units will reflect in your portfolio at Direct Plan NAV`,
    ],
  };
};
