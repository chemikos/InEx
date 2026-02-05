SELECT 
    i.name AS item_name,
    i.id_item,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COUNT(e.id_expense) AS expense_count
FROM items i
LEFT JOIN item_category ic ON i.id_item = ic.fk_item 
LEFT JOIN expenses e ON i.id_item = e.fk_item 
    AND strftime('%Y', e.date) = ?
    AND e.fk_profile = i.fk_profile
WHERE 
    i.fk_profile = ?
    AND ic.fk_category = ?
GROUP BY i.id_item
ORDER BY i.name;