import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          principal: number;
          tax_slab: number;
          language: string;
          goal: string;
          created_at: string;
        };
      };
      fd_bookings: {
        Row: {
          id: string;
          user_id: string;
          fd_id: string;
          bank_name: string;
          amount: number;
          gross_rate: number;
          tenor_months: number;
          booking_date: string;
          maturity_date: string;
          maturity_amount: number;
          created_at: string;
        };
      };
      mf_holdings: {
        Row: {
          id: string;
          user_id: string;
          fund_id: string;
          fund_name: string;
          invested_amount: number;
          holding_period_months: number;
          variant: string;
          expense_ratio: number;
          created_at: string;
        };
      };
    };
  };
};
