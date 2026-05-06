CREATE TABLE IF NOT EXISTS fd_rate_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  tenor_days INTEGER NOT NULL,
  gross_rate NUMERIC NOT NULL,
  previous_gross_rate NUMERIC,
  delta_rate NUMERIC NOT NULL DEFAULT 0,
  effective_date DATE DEFAULT CURRENT_DATE,
  source_label TEXT DEFAULT 'Vercel cron',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fd_rate_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'fd_rate_history'
      AND policyname = 'Anyone can view fd rate history'
  ) THEN
    CREATE POLICY "Anyone can view fd rate history" ON fd_rate_history
      FOR SELECT USING (true);
  END IF;
END
$$;
