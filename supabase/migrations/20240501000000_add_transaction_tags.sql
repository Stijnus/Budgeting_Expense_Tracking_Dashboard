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

-- Set up Row Level Security (RLS) for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Users can manage their own tags"
ON tags
USING (user_id = auth.uid());

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Create transaction_tags table
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Create indexes for transaction_tags
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);

-- Set up Row Level Security (RLS) for transaction_tags
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction_tags
CREATE POLICY "Users can manage their own transaction tags"
ON transaction_tags
USING (
    EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.id = transaction_id
        AND t.user_id = auth.uid()
    )
);

-- Down Migration
/*
DROP TABLE IF EXISTS transaction_tags;
DROP TABLE IF EXISTS tags;
*/
