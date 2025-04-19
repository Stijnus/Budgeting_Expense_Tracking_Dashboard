-- Create bills and subscriptions table
CREATE TABLE IF NOT EXISTS bills_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    currency currency_code NOT NULL DEFAULT 'USD',
    due_date DATE NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly', 'quarterly', 'one-time')),
    notes TEXT,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial goals table
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL NOT NULL,
    current_amount DECIMAL NOT NULL DEFAULT 0,
    currency currency_code NOT NULL DEFAULT 'USD',
    target_date DATE,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(name, user_id)
);

-- Create transaction_tags table
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bills_subscriptions_user_id ON bills_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_subscriptions_due_date ON bills_subscriptions(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);

-- Set up Row Level Security (RLS)
ALTER TABLE bills_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Skip creating policies for bills_subscriptions as they already exist

-- Skip creating policies for financial_goals as they already exist

-- Skip creating policies for tags and transaction_tags as they already exist

-- Skip creating triggers as they already exist

-- Grant permissions
GRANT ALL ON bills_subscriptions TO authenticated;
GRANT ALL ON financial_goals TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON transaction_tags TO authenticated;
GRANT ALL ON bills_subscriptions TO service_role;
GRANT ALL ON financial_goals TO service_role;
GRANT ALL ON tags TO service_role;
GRANT ALL ON transaction_tags TO service_role;
