-- Create a view that joins expenses with categories
CREATE OR REPLACE VIEW expenses_with_categories AS
SELECT 
    e.id,
    e.user_id,
    e.category_id,
    e.amount,
    e.currency,
    e.description,
    e.expense_date,
    e.created_at,
    e.updated_at,
    c.name AS category_name,
    c.color AS category_color
FROM 
    expenses e
LEFT JOIN 
    categories c ON e.category_id = c.id
WHERE 
    (auth.uid() = e.user_id OR 
     (SELECT current_setting('role') = 'service_role'));

-- Grant permissions on the view
GRANT SELECT ON expenses_with_categories TO authenticated;
GRANT SELECT ON expenses_with_categories TO anon;
GRANT ALL ON expenses_with_categories TO service_role;
