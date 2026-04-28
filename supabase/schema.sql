-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  principal NUMERIC DEFAULT 100000,
  tax_slab INTEGER DEFAULT 20,
  language TEXT DEFAULT 'en',
  goal TEXT DEFAULT 'Balanced',
  risk_tolerance TEXT DEFAULT 'Medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FD BOOKINGS table
CREATE TABLE fd_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fd_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_type TEXT,
  amount NUMERIC NOT NULL,
  gross_rate NUMERIC NOT NULL,
  tenor_months INTEGER NOT NULL,
  booking_date DATE DEFAULT CURRENT_DATE,
  maturity_date DATE NOT NULL,
  maturity_amount NUMERIC NOT NULL,
  net_maturity_amount NUMERIC,
  dicgc_insured BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MF HOLDINGS table
CREATE TABLE mf_holdings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  amc_name TEXT,
  category TEXT,
  variant TEXT DEFAULT 'Regular',
  invested_amount NUMERIC NOT NULL,
  holding_period_months INTEGER DEFAULT 12,
  expense_ratio NUMERIC,
  direct_pair_id TEXT,
  annual_saving NUMERIC,
  saving_10y NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT LOGS table (optional but useful)
CREATE TABLE chat_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  module TEXT DEFAULT 'general', -- 'fd', 'mf', 'general'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FD RATES table (for when you build the admin panel)
CREATE TABLE fd_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  bank_type TEXT NOT NULL,
  tenor_months INTEGER NOT NULL,
  gross_rate NUMERIC NOT NULL,
  dicgc_insured BOOLEAN DEFAULT true,
  rating TEXT,
  min_amount NUMERIC DEFAULT 1000,
  max_amount NUMERIC DEFAULT 100000000,
  special_features TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(bank_name, tenor_months)
);

-- Row Level Security (RLS) — users can only see their own data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own FD bookings" ON fd_bookings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own MF holdings" ON mf_holdings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chat logs" ON chat_logs
  FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Seed FD rates with existing data from fdData.ts
INSERT INTO fd_rates (bank_name, bank_type, tenor_months, gross_rate, dicgc_insured, rating, min_amount) VALUES
('State Bank of India', 'PSU', 3, 6.50, true, 'AAA', 10000),
('State Bank of India', 'PSU', 6, 6.75, true, 'AAA', 10000),
('State Bank of India', 'PSU', 12, 7.00, true, 'AAA', 10000),
('State Bank of India', 'PSU', 24, 7.00, true, 'AAA', 10000),
('State Bank of India', 'PSU', 36, 6.75, true, 'AAA', 10000),
('HDFC Bank', 'Private', 3, 6.75, true, 'AAA', 10000),
('HDFC Bank', 'Private', 6, 7.00, true, 'AAA', 10000),
('HDFC Bank', 'Private', 12, 7.25, true, 'AAA', 10000),
('HDFC Bank', 'Private', 24, 7.25, true, 'AAA', 10000),
('HDFC Bank', 'Private', 36, 7.25, true, 'AAA', 10000),
('Suryoday Small Finance Bank', 'SmallFinance', 3, 7.50, true, 'A+', 10000),
('Suryoday Small Finance Bank', 'SmallFinance', 6, 8.00, true, 'A+', 10000),
('Suryoday Small Finance Bank', 'SmallFinance', 12, 8.50, true, 'A+', 10000),
('Suryoday Small Finance Bank', 'SmallFinance', 24, 8.75, true, 'A+', 10000),
('Suryoday Small Finance Bank', 'SmallFinance', 36, 8.60, true, 'A+', 10000),
('Bajaj Finance', 'NBFC', 3, 7.35, false, 'AAA', 25000),
('Bajaj Finance', 'NBFC', 6, 7.60, false, 'AAA', 25000),
('Bajaj Finance', 'NBFC', 12, 8.10, false, 'AAA', 25000),
('Bajaj Finance', 'NBFC', 24, 8.25, false, 'AAA', 25000),
('Bajaj Finance', 'NBFC', 36, 8.35, false, 'AAA', 25000);

-- SHARED ANALYSES table
CREATE TABLE shared_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  share_token TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  total_annual_saving NUMERIC,
  total_10y_saving NUMERIC,
  fund_count INTEGER,
  portfolio_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  view_count INTEGER DEFAULT 0
);

-- WATCHLIST table
CREATE TABLE watchlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  scheme_code TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fund_id)
);

-- RLS for new tables
ALTER TABLE shared_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared analyses" ON shared_analyses
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can create their own shares" ON shared_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

