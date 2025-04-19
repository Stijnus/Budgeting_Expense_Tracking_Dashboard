-- Update the currency in the bills_subscriptions table
ALTER TABLE IF EXISTS bills_subscriptions 
ALTER COLUMN currency SET DEFAULT 'EUR';

-- Update the currency in the financial_goals table
ALTER TABLE IF EXISTS financial_goals 
ALTER COLUMN currency SET DEFAULT 'EUR';
