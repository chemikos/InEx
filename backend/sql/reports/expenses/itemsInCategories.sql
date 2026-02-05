SELECT 
    c.id_category, c.name AS category_name
    , GROUP_CONCAT(i.id_item) AS item_ids
    , GROUP_CONCAT(i.name) AS item_names
FROM categories c
LEFT JOIN item_category ic ON c.id_category = ic.fk_category
LEFT JOIN items i ON ic.fk_item = i.id_item
WHERE i.fk_profile = ?
GROUP BY c.id_category;