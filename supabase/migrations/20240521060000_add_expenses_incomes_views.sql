-- Create secure views with row-level security
CREATE OR REPLACE VIEW expenses AS
SELECT
    id,
    user_id,
    category_id,
    amount,
    currency,
    description,
    date AS expense_date,
    created_at,
    updated_at
FROM
    transactions
WHERE
    type = 'EXPENSE'
    AND (auth.uid() = user_id OR
         (SELECT current_setting('role') = 'service_role'));

CREATE OR REPLACE VIEW incomes AS
SELECT
    id,
    user_id,
    category_id,
    amount,
    currency,
    description,
    date AS income_date,
    created_at,
    updated_at
FROM
    transactions
WHERE
    type = 'INCOME'
    AND (auth.uid() = user_id OR
         (SELECT current_setting('role') = 'service_role'));

-- Grant permissions on the views
GRANT SELECT ON expenses TO authenticated;
GRANT SELECT ON incomes TO authenticated;
GRANT SELECT ON expenses TO anon;
GRANT SELECT ON incomes TO anon;
GRANT ALL ON expenses TO service_role;
GRANT ALL ON incomes TO service_role;