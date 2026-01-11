SELECT
  'total' AS period,
  i.id_item AS dimension_id,
  i.name AS dimension_name,
  SUM(e.amount) AS expense
FROM expenses e
JOIN items i ON i.id_item = e.fk_item
WHERE e.fk_profile = ?
GROUP BY i.id_item
ORDER BY expense DESC;