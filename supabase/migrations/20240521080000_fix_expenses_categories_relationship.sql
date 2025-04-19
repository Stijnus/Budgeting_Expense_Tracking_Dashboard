-- Drop the existing expenses view
DROP VIEW IF EXISTS expenses_with_categories;
DROP VIEW IF EXISTS expenses;

-- Create a new expenses view with the correct relationship to categories
CREATE OR REPLACE VIEW expenses AS
SELECT 
    t.id,
    t.user_id,
    t.category_id,
    t.amount,
    t.currency,
    t.description,
    t.date AS expense_date,
    t.created_at,
    t.updated_at,
    c.name AS category_name,
    c.color AS category_color
FROM 
    transactions t
LEFT JOIN 
    categories c ON t.category_id = c.id
WHERE 
    t.type = 'EXPENSE'
    AND (t.user_id = auth.uid() OR 
         (SELECT current_setting('role') = 'service_role'));

-- Grant permissions on the view
GRANT SELECT ON expenses TO authenticated;
GRANT SELECT ON expenses TO anon;
GRANT ALL ON expenses TO service_role;
