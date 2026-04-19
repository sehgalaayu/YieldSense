export interface FDProduct {
  id: string;
  bankName: string;
  bankType: 'PSU' | 'Private' | 'SmallFinance' | 'NBFC';
  tenor: number; // in months
  grossRate: number; // annual percentage
  interestType: 'Cumulative' | 'MonthlyPayout' | 'QuarterlyPayout';
  minAmount: number;
  maxAmount: number;
  dicgcInsured: boolean;
  rating: string;
  specialFeatures: string[];
}

export interface CalculationInput {
  principal: number;
  grossRate: number;
  tenorMonths: number;
  taxSlab: 0 | 5 | 20 | 30;
  interestType: 'Cumulative' | 'MonthlyPayout';
}

export interface CalculationResult {
  grossMaturityAmount: number;
  grossInterestEarned: number;
  tdsDeducted: number;
  taxPayable: number;
  netInterestEarned: number;
  netMaturityAmount: number;
  effectiveAnnualYield: number;
  monthlyPayout?: number;
}

export interface UserProfile {
  principal: number;
  tenorMonths: number;
  taxSlab: 0 | 5 | 20 | 30;
  riskTolerance: 'Low' | 'Medium' | 'High';
  liquidityNeed: 'Low' | 'Medium' | 'High';
  goal: 'MaxYield' | 'Safety' | 'Balanced';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BookedFD {
  fdId: string;
  bankName: string;
  amount: number;
  tenor: number;
  grossRate: number;
  date: string;
}

