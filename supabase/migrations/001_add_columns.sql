-- Add missing columns to fd_bookings
ALTER TABLE fd_bookings 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS bank_type TEXT;

-- Add MF analysis results table
CREATE TABLE IF NOT EXISTS mf_analysis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  invested_amount NUMERIC NOT NULL,
  annual_drain NUMERIC,
  annual_saving NUMERIC,
  saving_5y NUMERIC,
  saving_10y NUMERIC,
  saving_20y NUMERIC,
  should_switch BOOLEAN,
  switch_urgency TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mf_analysis_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own MF analysis" ON mf_analysis_results
  FOR ALL USING (auth.uid() = user_id);
