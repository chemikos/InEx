SELECT
  'total' AS period,
  c.id_category AS dimension_id,
  c.name AS dimension_name,
  SUM(e.amount) AS expense
FROM expenses e
JOIN item_category ic ON ic.fk_item = e.fk_item
JOIN categories c ON c.id_category = ic.fk_category
WHERE e.fk_profile = ?
GROUP BY c.id_category
ORDER BY expense DESC;