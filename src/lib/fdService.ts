import { supabase } from './supabase';
import { fdProducts as fallbackProducts } from './fdData';

export const fetchFDRates = async () => {
  const { data, error } = await supabase
    .from('fd_rates')
    .select('*')
    .eq('is_active', true)
    .order('bank_name', { ascending: true });
  
  if (error || !data || data.length === 0) {
    console.warn('Using fallback FD data');
    return null;
  }
  
  return data.map(row => ({
    id: `${row.bank_name}-${row.tenor_months}`.toLowerCase().replace(/\s/g, '-'),
    bankName: row.bank_name,
    bankType: row.bank_type as any,
    tenor: row.tenor_months,
    grossRate: row.gross_rate,
    dicgcInsured: row.dicgc_insured,
    rating: row.rating,
    minAmount: row.min_amount,
    maxAmount: row.max_amount,
    lastUpdated: row.last_updated,
    interestType: 'Cumulative' as const,
    specialFeatures: [],
  }));
};
