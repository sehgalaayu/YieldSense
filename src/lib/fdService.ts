// src/lib/fdService.ts - COMPLETE REWRITE

import { supabase } from './supabase';

export interface FDProduct {
  id: string;
  bankName: string;
  bankType: 'PSU' | 'Private' | 'SmallFinance' | 'NBFC';
  tenor: number;
  grossRate: number;
  interestType: 'Cumulative' | 'MonthlyPayout';
  minAmount: number;
  maxAmount: number;
  dicgcInsured: boolean;
  rating: string;
  specialFeatures: string[];
  lastUpdated: string;
}

// Module-level cache — fetched once per session
let fdCache: FDProduct[] | null = null;
let fdCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getFDRates = async (): Promise<FDProduct[]> => {
  // Return cache if fresh
  if (fdCache && Date.now() - fdCacheTime < CACHE_DURATION) {
    return fdCache;
  }

  try {
    const { data, error } = await supabase
      .from('fd_rates')
      .select('*')
      .eq('is_active', true)
      .order('gross_rate', { ascending: false });

    if (error || !data || data.length === 0) {
      throw new Error('Supabase fetch failed');
    }

    fdCache = data.map(row => ({
      id: `${row.bank_name}-${row.tenor_months}`
        .toLowerCase().replace(/\s+/g, '-'),
      bankName: row.bank_name,
      bankType: row.bank_type as FDProduct['bankType'],
      tenor: row.tenor_months,
      grossRate: parseFloat(row.gross_rate),
      interestType: 'Cumulative' as const,
      minAmount: row.min_amount,
      maxAmount: row.max_amount,
      dicgcInsured: row.dicgc_insured,
      rating: row.rating || 'N/A',
      specialFeatures: row.special_features 
        ? [row.special_features] : [],
      lastUpdated: row.last_updated,
    }));

    fdCacheTime = Date.now();
    return fdCache;

  } catch (err) {
    console.warn('Supabase FD fetch failed, using local fallback');
    // Import and return hardcoded data as last resort
    const { fdProducts } = await import('./fdData');
    return fdProducts;
  }
};

// Get FDs filtered and sorted for compare page
export const getFilteredFDs = async (
  filter: 'BestYield' | 'Safest' | 'ShortTerm' | 'LongTerm',
  userPrincipal: number = 100000,
  userTaxSlab: number = 20,
  userTenor: number = 12
): Promise<FDProduct[]> => {
  const allFDs = await getFDRates();
  
  switch (filter) {
    case 'BestYield':
      return allFDs
        .filter(fd => Math.abs(fd.tenor - userTenor) <= 6)
        .sort((a, b) => b.grossRate - a.grossRate);
    
    case 'Safest':
      return allFDs
        .filter(fd => fd.dicgcInsured)
        .sort((a, b) => {
          // PSU > Private > SFB > NBFC
          const safetyOrder = { PSU: 4, Private: 3, SmallFinance: 2, NBFC: 1 };
          return (safetyOrder[b.bankType as keyof typeof safetyOrder] || 0) - (safetyOrder[a.bankType as keyof typeof safetyOrder] || 0);
        });
    
    case 'ShortTerm':
      return allFDs
        .filter(fd => fd.tenor <= 12)
        .sort((a, b) => b.grossRate - a.grossRate);
    
    case 'LongTerm':
      return allFDs
        .filter(fd => fd.tenor >= 24)
        .sort((a, b) => b.grossRate - a.grossRate);
    
    default:
      return allFDs;
  }
};

// Get last updated date from data
export const getFDLastUpdated = async (): Promise<string> => {
  const fds = await getFDRates();
  return fds[0]?.lastUpdated || 'April 2026';
};
