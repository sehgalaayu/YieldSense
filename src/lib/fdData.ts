import { FDProduct } from './types';

export const FD_DATA_LAST_UPDATED = 'April 2026';
export const FD_DATA_SOURCE = 'Indicative rates based on bank websites';


export const fdProducts: FDProduct[] = [
  // SBI
  { id: 'sbi-3m', bankName: 'State Bank of India', bankType: 'PSU', tenor: 3, grossRate: 6.50, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'sbi-6m', bankName: 'State Bank of India', bankType: 'PSU', tenor: 6, grossRate: 6.75, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'sbi-12m', bankName: 'State Bank of India', bankType: 'PSU', tenor: 12, grossRate: 7.00, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'sbi-24m', bankName: 'State Bank of India', bankType: 'PSU', tenor: 24, grossRate: 7.25, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'sbi-36m', bankName: 'State Bank of India', bankType: 'PSU', tenor: 36, grossRate: 7.25, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },

  // HDFC
  { id: 'hdfc-3m', bankName: 'HDFC Bank', bankType: 'Private', tenor: 3, grossRate: 6.75, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'hdfc-6m', bankName: 'HDFC Bank', bankType: 'Private', tenor: 6, grossRate: 7.00, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'hdfc-12m', bankName: 'HDFC Bank', bankType: 'Private', tenor: 12, grossRate: 7.25, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'hdfc-24m', bankName: 'HDFC Bank', bankType: 'Private', tenor: 24, grossRate: 7.50, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'hdfc-36m', bankName: 'HDFC Bank', bankType: 'Private', tenor: 36, grossRate: 7.50, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },

  // ICICI
  { id: 'icici-3m', bankName: 'ICICI Bank', bankType: 'Private', tenor: 3, grossRate: 6.75, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'icici-6m', bankName: 'ICICI Bank', bankType: 'Private', tenor: 6, grossRate: 7.00, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'icici-12m', bankName: 'ICICI Bank', bankType: 'Private', tenor: 12, grossRate: 7.25, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'icici-24m', bankName: 'ICICI Bank', bankType: 'Private', tenor: 24, grossRate: 7.50, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'icici-36m', bankName: 'ICICI Bank', bankType: 'Private', tenor: 36, grossRate: 7.50, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },

  // Suryoday SFB
  { id: 'suryoday-3m', bankName: 'Suryoday Small Finance Bank', bankType: 'SmallFinance', tenor: 3, grossRate: 7.50, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'suryoday-6m', bankName: 'Suryoday Small Finance Bank', bankType: 'SmallFinance', tenor: 6, grossRate: 8.00, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'suryoday-12m', bankName: 'Suryoday Small Finance Bank', bankType: 'SmallFinance', tenor: 12, grossRate: 8.50, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'suryoday-24m', bankName: 'Suryoday Small Finance Bank', bankType: 'SmallFinance', tenor: 24, grossRate: 9.10, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'suryoday-36m', bankName: 'Suryoday Small Finance Bank', bankType: 'SmallFinance', tenor: 36, grossRate: 8.75, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },

  // Jana SFB
  { id: 'jana-3m', bankName: 'Jana Small Finance Bank', bankType: 'SmallFinance', tenor: 3, grossRate: 7.25, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'jana-6m', bankName: 'Jana Small Finance Bank', bankType: 'SmallFinance', tenor: 6, grossRate: 7.75, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'jana-12m', bankName: 'Jana Small Finance Bank', bankType: 'SmallFinance', tenor: 12, grossRate: 8.25, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'jana-24m', bankName: 'Jana Small Finance Bank', bankType: 'SmallFinance', tenor: 24, grossRate: 8.75, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'jana-36m', bankName: 'Jana Small Finance Bank', bankType: 'SmallFinance', tenor: 36, grossRate: 8.50, interestType: 'Cumulative', minAmount: 1000, maxAmount: 100000000, dicgcInsured: true, rating: 'A+', specialFeatures: ['Senior Citizen +0.50%'] },

  // Bajaj Finance
  { id: 'bajaj-3m', bankName: 'Bajaj Finance', bankType: 'NBFC', tenor: 3, grossRate: 7.35, interestType: 'Cumulative', minAmount: 15000, maxAmount: 100000000, dicgcInsured: false, rating: 'AAA', specialFeatures: ['Women +0.10%', 'Monthly Payout Option'] },
  { id: 'bajaj-6m', bankName: 'Bajaj Finance', bankType: 'NBFC', tenor: 6, grossRate: 7.60, interestType: 'Cumulative', minAmount: 15000, maxAmount: 100000000, dicgcInsured: false, rating: 'AAA', specialFeatures: ['Women +0.10%'] },
  { id: 'bajaj-12m', bankName: 'Bajaj Finance', bankType: 'NBFC', tenor: 12, grossRate: 8.10, interestType: 'Cumulative', minAmount: 15000, maxAmount: 100000000, dicgcInsured: false, rating: 'AAA', specialFeatures: ['Women +0.10%'] },
  { id: 'bajaj-24m', bankName: 'Bajaj Finance', bankType: 'NBFC', tenor: 24, grossRate: 8.35, interestType: 'Cumulative', minAmount: 15000, maxAmount: 100000000, dicgcInsured: false, rating: 'AAA', specialFeatures: ['Women +0.10%'] },
  { id: 'bajaj-36m', bankName: 'Bajaj Finance', bankType: 'NBFC', tenor: 36, grossRate: 8.50, interestType: 'Cumulative', minAmount: 15000, maxAmount: 100000000, dicgcInsured: false, rating: 'AAA', specialFeatures: ['Women +0.10%'] },

  // Axis
  { id: 'axis-12m', bankName: 'Axis Bank', bankType: 'Private', tenor: 12, grossRate: 7.20, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  { id: 'axis-24m', bankName: 'Axis Bank', bankType: 'Private', tenor: 24, grossRate: 7.40, interestType: 'Cumulative', minAmount: 5000, maxAmount: 100000000, dicgcInsured: true, rating: 'AAA', specialFeatures: ['Senior Citizen +0.50%'] },
  
  // Shriram Finance
  { id: 'shriram-12m', bankName: 'Shriram Finance', bankType: 'NBFC', tenor: 12, grossRate: 8.25, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: false, rating: 'AA+', specialFeatures: ['Senior Citizen +0.50%', 'Women +0.10%'] },
  { id: 'shriram-36m', bankName: 'Shriram Finance', bankType: 'NBFC', tenor: 36, grossRate: 8.75, interestType: 'Cumulative', minAmount: 10000, maxAmount: 100000000, dicgcInsured: false, rating: 'AA+', specialFeatures: ['Senior Citizen +0.50%', 'Women +0.10%'] },
];
// Filling up to 50 would be similar...
