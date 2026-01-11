SELECT
  'total' AS period,
  l.id_label AS dimension_id,
  l.name AS dimension_name,
  SUM(e.amount) AS expense
FROM expenses e
JOIN item_label il ON il.fk_item = e.fk_item
JOIN labels l ON l.id_label = il.fk_label
WHERE e.fk_profile = ?
GROUP BY l.id_label
ORDER BY expense DESC;
