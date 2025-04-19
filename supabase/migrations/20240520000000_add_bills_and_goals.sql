-- Create bills and subscriptions table
CREATE TABLE IF NOT EXISTS bills_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bills_subscriptions_user_id ON bills_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_subscriptions_due_date ON bills_subscriptions(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE bills_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for bills_subscriptions
CREATE POLICY "Users can view their own bills and subscriptions"
    ON bills_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills and subscriptions"
    ON bills_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills and subscriptions"
    ON bills_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills and subscriptions"
    ON bills_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for financial_goals
CREATE POLICY "Users can view their own financial goals"
    ON financial_goals
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial goals"
    ON financial_goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial goals"
    ON financial_goals
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial goals"
    ON financial_goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_bills_subscriptions_updated_at
    BEFORE UPDATE ON bills_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_updated_at_column();

CREATE TRIGGER update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_updated_at_column();
