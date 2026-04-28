-- Create fd_rates table if it doesn't exist
CREATE TABLE IF NOT EXISTS fd_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  bank_type TEXT NOT NULL, -- PSU, Private, SmallFinance, NBFC
  tenor_months INTEGER NOT NULL,
  gross_rate NUMERIC NOT NULL,
  dicgc_insured BOOLEAN DEFAULT true,
  rating TEXT,
  min_amount NUMERIC DEFAULT 1000,
  max_amount NUMERIC DEFAULT 100000000,
  special_features TEXT, -- Store as string, service will split
  last_updated DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_fd_rates_bank_name ON fd_rates(bank_name);
CREATE INDEX IF NOT EXISTS idx_fd_rates_active ON fd_rates(is_active);

-- Enable RLS
ALTER TABLE fd_rates ENABLE ROW LEVEL SECURITY;

-- Read policy for everyone
CREATE POLICY "Public read access for FD rates" ON fd_rates
  FOR SELECT USING (true);
