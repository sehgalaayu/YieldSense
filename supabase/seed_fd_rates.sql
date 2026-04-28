-- Clear existing rates before seeding
TRUNCATE TABLE fd_rates;

INSERT INTO fd_rates (
  bank_name, bank_type, tenor_months, gross_rate, 
  dicgc_insured, rating, min_amount, max_amount,
  special_features, last_updated, is_active
) VALUES
-- SBI
('State Bank of India', 'PSU', 3, 6.50, true, 'AAA', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('State Bank of India', 'PSU', 6, 6.75, true, 'AAA', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('State Bank of India', 'PSU', 12, 7.00, true, 'AAA', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('State Bank of India', 'PSU', 24, 7.25, true, 'AAA', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('State Bank of India', 'PSU', 36, 7.25, true, 'AAA', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
-- HDFC
('HDFC Bank', 'Private', 3, 6.75, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('HDFC Bank', 'Private', 6, 7.00, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('HDFC Bank', 'Private', 12, 7.25, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('HDFC Bank', 'Private', 24, 7.50, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('HDFC Bank', 'Private', 36, 7.50, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
-- ICICI
('ICICI Bank', 'Private', 3, 6.75, true, 'AAA', 10000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('ICICI Bank', 'Private', 6, 7.00, true, 'AAA', 10000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('ICICI Bank', 'Private', 12, 7.25, true, 'AAA', 10000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('ICICI Bank', 'Private', 24, 7.50, true, 'AAA', 10000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('ICICI Bank', 'Private', 36, 7.50, true, 'AAA', 10000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
-- Suryoday SFB
('Suryoday Small Finance Bank', 'SmallFinance', 3, 7.50, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Suryoday Small Finance Bank', 'SmallFinance', 6, 8.00, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Suryoday Small Finance Bank', 'SmallFinance', 12, 8.50, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Suryoday Small Finance Bank', 'SmallFinance', 24, 9.10, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Suryoday Small Finance Bank', 'SmallFinance', 36, 8.75, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
-- Jana SFB
('Jana Small Finance Bank', 'SmallFinance', 3, 7.25, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Jana Small Finance Bank', 'SmallFinance', 6, 7.75, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Jana Small Finance Bank', 'SmallFinance', 12, 8.25, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Jana Small Finance Bank', 'SmallFinance', 24, 8.75, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Jana Small Finance Bank', 'SmallFinance', 36, 8.50, true, 'A+', 1000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
-- Bajaj Finance
('Bajaj Finance', 'NBFC', 3, 7.35, false, 'AAA', 15000, 100000000, 'Women +0.10%, Monthly Payout Option', '2026-04-27', true),
('Bajaj Finance', 'NBFC', 6, 7.60, false, 'AAA', 15000, 100000000, 'Women +0.10%', '2026-04-27', true),
('Bajaj Finance', 'NBFC', 12, 8.10, false, 'AAA', 15000, 100000000, 'Women +0.10%', '2026-04-27', true),
('Bajaj Finance', 'NBFC', 24, 8.35, false, 'AAA', 15000, 100000000, 'Women +0.10%', '2026-04-27', true),
('Bajaj Finance', 'NBFC', 36, 8.50, false, 'AAA', 15000, 100000000, 'Women +0.10%', '2026-04-27', true),
-- Axis
('Axis Bank', 'Private', 12, 7.20, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
('Axis Bank', 'Private', 24, 7.40, true, 'AAA', 5000, 100000000, 'Senior Citizen +0.50%', '2026-04-27', true),
-- Shriram Finance
('Shriram Finance', 'NBFC', 12, 8.25, false, 'AA+', 10000, 100000000, 'Senior Citizen +0.50%, Women +0.10%', '2026-04-27', true),
('Shriram Finance', 'NBFC', 36, 8.75, false, 'AA+', 10000, 100000000, 'Senior Citizen +0.50%, Women +0.10%', '2026-04-27', true)
ON CONFLICT (bank_name, tenor_months) DO UPDATE SET
  gross_rate = EXCLUDED.gross_rate,
  last_updated = EXCLUDED.last_updated,
  is_active = EXCLUDED.is_active;
