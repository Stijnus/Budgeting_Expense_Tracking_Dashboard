-- Create transaction_tags table
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);

-- Set up Row Level Security (RLS)
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own transaction tags"
ON transaction_tags
USING (
    EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.id = transaction_id
        AND t.user_id = auth.uid()
    )
);

-- Down Migration (commented out)
/*
DROP TABLE IF EXISTS transaction_tags;
*/
